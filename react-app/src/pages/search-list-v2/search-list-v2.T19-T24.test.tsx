import { render, waitFor, screen, within, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { ConfigProvider } from 'antd';
import jaJP from 'antd/es/locale/ja_JP';
import SearchListV2 from './index';
import * as apiModule from '@/services/ant-design-pro/api';
import jaJPMessages from '@/locales/ja-JP';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock the API service
jest.mock('@/services/ant-design-pro/api', () => ({
  getAllInventory: jest.fn(),
  insertInventoryRecordArray: jest.fn(),
  updateInventoryRecordBatch: jest.fn(),
  deleteInventoryRecordArray: jest.fn(),
  addInventoryRecordBatch: jest.fn(),
  backendIntegrityCheck: jest.fn(),
  addInventoryRecord: jest.fn(),
  updateInventoryRecord: jest.fn(),

}));

// Mock XLSX to avoid file system operations in tests
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
    sheet_to_json: jest.fn(),
  },
  writeFile: jest.fn(),
  read: jest.fn(),
}));

const mockDataCreator = (desiredElements: number) => {
  let mockDataArray = [];
  for(let i = 1; i <= desiredElements; i++){
    const newElement = {
      id: String(i),
      companyCode: `000${i}`,
      previousFactoryCode: `000${i}`,
      productFactoryCode: `000${i}`,
      startOperationDate: '2023-01-01',
      endOperationDate: '2023-12-31',
      previousFactoryName: `Previous Factory ${i}`,
      productFactoryName: `Product Factory ${i}`,
      materialDepartmentCode: `000${i}`,
      environmentalInformation: `Environmental Information ${i}`,
      authenticationFlag: `Authentication Flag ${i}`,
      groupCorporateCode: `Group Corporate Code ${i}`,
      integrationPattern: `Integration Pattern ${i}`,
      hulftid: `Hulftid ${i}`,
    }
    mockDataArray.push(newElement)
  }
  return mockDataArray;
}

describe('SearchListV2 Component', () => {
  const mockGetAllInventory = apiModule.getAllInventory as jest.Mock;
  const mockInsertInventoryRecordArray = apiModule.insertInventoryRecordArray as jest.Mock;
  const mockAddRecord = apiModule.addInventoryRecord as jest.Mock;
  const mockUpdateRecord = apiModule.updateInventoryRecord as jest.Mock;
  const mockUpdateMultipleRecord = apiModule.updateInventoryRecordBatch as jest.Mock;
  const mockDeleteInventoryRecordArray = apiModule.deleteInventoryRecordArray as jest.Mock;


  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Default mock implementation
    mockGetAllInventory.mockResolvedValue({
      data: [],
      success: true,
    });
  });

  afterAll((done) => {
    // Clean up any open handles
    jest.clearAllTimers();
    // Allow event loop to process any pending operations
    setTimeout(() => {
      done();
    }, 100);
  });

  const renderWithIntl = (component: any, locale: string = 'ja-JP') => {
    const antdLocale = locale === 'ja-JP' ? jaJP : jaJP;
    const messages = locale === 'ja-JP' ? jaJPMessages : jaJPMessages;
    return render(
      React.createElement(
        ConfigProvider,
        { locale: antdLocale },
        React.createElement(
          IntlProvider,
          { locale: locale, messages: messages },
          component
        )
      )
    );
  };

it('T0019: Check 複数登録 functionality 保存 - It should make 2 calls to the API: Insert multiple records and get all records', async () => {

  const mockData = mockDataCreator(3);
  const mockDataInitial = mockData.slice(0,1);
  const mockDataInsert = mockData.slice(1,3);

  // Mock the API response
  mockGetAllInventory.mockResolvedValue({
    data: mockDataInitial,
    success: true,
    total: mockDataInitial.length,
  });

  mockInsertInventoryRecordArray.mockResolvedValue({
    success: true
  });

  const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

  // Wait for the table to load
  let tableWrapper: HTMLElement | null = null;
  await waitFor(() => {
    tableWrapper = container.querySelector('.ant-table-wrapper');
    expect(tableWrapper).toBeTruthy();
  }, { timeout: 1000 });

  // Verify API was called
  expect(mockGetAllInventory).toHaveBeenCalled();

  if (tableWrapper) {
    // Wait for the data to be loaded and rendered
    await waitFor(() => {
      // Find all rows in the table body
      const rows = within(tableWrapper!).queryAllByRole('row');
      // First row is header, so we expect at least 2 rows (header + data)
      expect(rows.length).toBeGreaterThan(1);
    }, { timeout: 1000 });


    // Find and click the 新規登録 button
    const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
    expect(toolbar).toBeTruthy();

    const multipleRegisterButton = await within(toolbar!).findByText(/複数登録/i, {}, {timeout: 1000});
    expect(multipleRegisterButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleRegisterButton);
    });

    // check control buttons

    const insertButton = await within(toolbar!).findByText(/新規登録/i, {}, {timeout: 1000});
    expect(insertButton).toBeTruthy();
    const saveButton = await within(toolbar!).findByText(/保存/i, {}, {timeout: 1000});
    expect(saveButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(insertButton);
    });

    await waitFor(() => {
      const rows = within(tableWrapper!).queryAllByRole('row');
      expect(rows.length).toBeGreaterThan(2);
    }, {timeout: 1000})

    act( () => {
      fireEvent.click(insertButton);
    });

    await waitFor(() => {
      const rows = within(tableWrapper!).queryAllByRole('row');
      expect(rows.length).toBeGreaterThan(3);
    }, {timeout: 1000})

    const rows = within(tableWrapper!).queryAllByRole('row');

    const textboxes1 = rows[1].querySelectorAll('input');
    expect(textboxes1.length).toBe(13);

    act(() => {
      fireEvent.change(textboxes1[0], { target: { value: mockDataInsert[0].companyCode } });
      fireEvent.change(textboxes1[1], { target: { value: mockDataInsert[0].previousFactoryCode } });
      fireEvent.change(textboxes1[2], { target: { value: mockDataInsert[0].productFactoryCode } });
      fireEvent.change(textboxes1[3], { target: { value: mockDataInsert[0].startOperationDate } });
      fireEvent.change(textboxes1[4], { target: { value: mockDataInsert[0].endOperationDate } });
      fireEvent.change(textboxes1[5], { target: { value: mockDataInsert[0].previousFactoryName } });
      fireEvent.change(textboxes1[6], { target: { value: mockDataInsert[0].productFactoryName } });
      fireEvent.change(textboxes1[7], { target: { value: mockDataInsert[0].materialDepartmentCode } });
      fireEvent.change(textboxes1[8], { target: { value: mockDataInsert[0].environmentalInformation } });
      fireEvent.change(textboxes1[9], { target: { value: mockDataInsert[0].authenticationFlag } });
      fireEvent.change(textboxes1[10], { target: { value: mockDataInsert[0].groupCorporateCode } });
      fireEvent.change(textboxes1[11], { target: { value: mockDataInsert[0].integrationPattern } });
      fireEvent.change(textboxes1[12], { target: { value: mockDataInsert[0].hulftid } });
    })


    const textboxes2 = rows[2].querySelectorAll('input');
    expect(textboxes2.length).toBe(13);

    act(() => {
      fireEvent.change(textboxes2[0], { target: { value: mockDataInsert[1].companyCode } });
      fireEvent.change(textboxes2[1], { target: { value: mockDataInsert[1].previousFactoryCode } });
      fireEvent.change(textboxes2[2], { target: { value: mockDataInsert[1].productFactoryCode } });
      fireEvent.change(textboxes2[3], { target: { value: mockDataInsert[1].startOperationDate } });
      fireEvent.change(textboxes2[4], { target: { value: mockDataInsert[1].endOperationDate } });
      fireEvent.change(textboxes2[5], { target: { value: mockDataInsert[1].previousFactoryName } });
      fireEvent.change(textboxes2[6], { target: { value: mockDataInsert[1].productFactoryName } });
      fireEvent.change(textboxes2[7], { target: { value: mockDataInsert[1].materialDepartmentCode } });
      fireEvent.change(textboxes2[8], { target: { value: mockDataInsert[1].environmentalInformation } });
      fireEvent.change(textboxes2[9], { target: { value: mockDataInsert[1].authenticationFlag } });
      fireEvent.change(textboxes2[10], { target: { value: mockDataInsert[1].groupCorporateCode } });
      fireEvent.change(textboxes2[11], { target: { value: mockDataInsert[1].integrationPattern } });
      fireEvent.change(textboxes2[12], { target: { value: mockDataInsert[1].hulftid } });
    })

    await waitFor(() => {
      const textboxes2 = rows[2].querySelectorAll('input');
      expect(textboxes2[0].value).toBe(mockDataInsert[1].companyCode);
      expect(textboxes2[1].value).toBe(mockDataInsert[1].previousFactoryCode);
      expect(textboxes2[2].value).toBe(mockDataInsert[1].productFactoryCode);
      expect(textboxes2[3].value).toBe(mockDataInsert[1].startOperationDate);
      expect(textboxes2[4].value).toBe(mockDataInsert[1].endOperationDate);
      expect(textboxes2[5].value).toBe(mockDataInsert[1].previousFactoryName);
      expect(textboxes2[6].value).toBe(mockDataInsert[1].productFactoryName);
      expect(textboxes2[7].value).toBe(mockDataInsert[1].materialDepartmentCode);
      expect(textboxes2[8].value).toBe(mockDataInsert[1].environmentalInformation);
      expect(textboxes2[9].value).toBe(mockDataInsert[1].authenticationFlag);
      expect(textboxes2[10].value).toBe(mockDataInsert[1].groupCorporateCode);
      expect(textboxes2[11].value).toBe(mockDataInsert[1].integrationPattern);
      expect(textboxes2[12].value).toBe(mockDataInsert[1].hulftid);
    }, {timeout: 1000})

    act(() => {
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(mockInsertInventoryRecordArray).toHaveBeenCalled();
      expect(mockGetAllInventory).toHaveBeenCalled();
    })

  }
});

it('T0020: Check 複数登録 functionality キャンセル - It should exit the 複数登録 mode, also it should make a API call for getting all records', async () => {

  const mockData = mockDataCreator(3);
  const mockDataInitial = mockData.slice(0,1);
  const mockDataInsert = mockData.slice(1,3);

  // Mock the API response
  mockGetAllInventory.mockResolvedValue({
    data: mockDataInitial,
    success: true,
    total: mockDataInitial.length,
  });

  mockInsertInventoryRecordArray.mockResolvedValue({
    success: true
  });

  const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

  // Wait for the table to load
  let tableWrapper: HTMLElement | null = null;
  await waitFor(() => {
    tableWrapper = container.querySelector('.ant-table-wrapper');
    expect(tableWrapper).toBeTruthy();
  }, { timeout: 1000 });

  // Verify API was called
  expect(mockGetAllInventory).toHaveBeenCalled();

  if (tableWrapper) {
    // Wait for the data to be loaded and rendered
    await waitFor(() => {
      // Find all rows in the table body
      const rows = within(tableWrapper!).queryAllByRole('row');
      // First row is header, so we expect at least 2 rows (header + data)
      expect(rows.length).toBeGreaterThan(1);
    }, { timeout: 1000 });


    // Find and click the 新規登録 button
    const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
    expect(toolbar).toBeTruthy();

    const multipleRegisterButton = await within(toolbar!).findByText(/複数登録/i, {}, {timeout: 1000});
    expect(multipleRegisterButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleRegisterButton);
    });

    // check control buttons

    const insertButton = await within(toolbar!).findByText(/新規登録/i, {}, {timeout: 1000});
    expect(insertButton).toBeTruthy();
    const cancelButton = await within(toolbar!).findByText(/キャンセル/i, {}, {timeout: 1000});
    expect(cancelButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(insertButton);
    });

    await waitFor(() => {
      const rows = within(tableWrapper!).queryAllByRole('row');
      expect(rows.length).toBeGreaterThan(2);
    }, {timeout: 1000})

    act( () => {
      fireEvent.click(insertButton);
    });

    await waitFor(() => {
      const rows = within(tableWrapper!).queryAllByRole('row');
      expect(rows.length).toBeGreaterThan(3);
    }, {timeout: 1000})

    const rows = within(tableWrapper!).queryAllByRole('row');

    const textboxes1 = rows[1].querySelectorAll('input');
    expect(textboxes1.length).toBe(13);

    act(() => {
      fireEvent.change(textboxes1[0], { target: { value: mockDataInsert[0].companyCode } });
      fireEvent.change(textboxes1[1], { target: { value: mockDataInsert[0].previousFactoryCode } });
      fireEvent.change(textboxes1[2], { target: { value: mockDataInsert[0].productFactoryCode } });
      fireEvent.change(textboxes1[3], { target: { value: mockDataInsert[0].startOperationDate } });
      fireEvent.change(textboxes1[4], { target: { value: mockDataInsert[0].endOperationDate } });
      fireEvent.change(textboxes1[5], { target: { value: mockDataInsert[0].previousFactoryName } });
      fireEvent.change(textboxes1[6], { target: { value: mockDataInsert[0].productFactoryName } });
      fireEvent.change(textboxes1[7], { target: { value: mockDataInsert[0].materialDepartmentCode } });
      fireEvent.change(textboxes1[8], { target: { value: mockDataInsert[0].environmentalInformation } });
      fireEvent.change(textboxes1[9], { target: { value: mockDataInsert[0].authenticationFlag } });
      fireEvent.change(textboxes1[10], { target: { value: mockDataInsert[0].groupCorporateCode } });
      fireEvent.change(textboxes1[11], { target: { value: mockDataInsert[0].integrationPattern } });
      fireEvent.change(textboxes1[12], { target: { value: mockDataInsert[0].hulftid } });
    })


    const textboxes2 = rows[2].querySelectorAll('input');
    expect(textboxes2.length).toBe(13);

    act(() => {
      fireEvent.change(textboxes2[0], { target: { value: mockDataInsert[1].companyCode } });
      fireEvent.change(textboxes2[1], { target: { value: mockDataInsert[1].previousFactoryCode } });
      fireEvent.change(textboxes2[2], { target: { value: mockDataInsert[1].productFactoryCode } });
      fireEvent.change(textboxes2[3], { target: { value: mockDataInsert[1].startOperationDate } });
      fireEvent.change(textboxes2[4], { target: { value: mockDataInsert[1].endOperationDate } });
      fireEvent.change(textboxes2[5], { target: { value: mockDataInsert[1].previousFactoryName } });
      fireEvent.change(textboxes2[6], { target: { value: mockDataInsert[1].productFactoryName } });
      fireEvent.change(textboxes2[7], { target: { value: mockDataInsert[1].materialDepartmentCode } });
      fireEvent.change(textboxes2[8], { target: { value: mockDataInsert[1].environmentalInformation } });
      fireEvent.change(textboxes2[9], { target: { value: mockDataInsert[1].authenticationFlag } });
      fireEvent.change(textboxes2[10], { target: { value: mockDataInsert[1].groupCorporateCode } });
      fireEvent.change(textboxes2[11], { target: { value: mockDataInsert[1].integrationPattern } });
      fireEvent.change(textboxes2[12], { target: { value: mockDataInsert[1].hulftid } });
    })

    await waitFor(() => {
      const textboxes2 = rows[2].querySelectorAll('input');
      expect(textboxes2[0].value).toBe(mockDataInsert[1].companyCode);
      expect(textboxes2[1].value).toBe(mockDataInsert[1].previousFactoryCode);
      expect(textboxes2[2].value).toBe(mockDataInsert[1].productFactoryCode);
      expect(textboxes2[3].value).toBe(mockDataInsert[1].startOperationDate);
      expect(textboxes2[4].value).toBe(mockDataInsert[1].endOperationDate);
      expect(textboxes2[5].value).toBe(mockDataInsert[1].previousFactoryName);
      expect(textboxes2[6].value).toBe(mockDataInsert[1].productFactoryName);
      expect(textboxes2[7].value).toBe(mockDataInsert[1].materialDepartmentCode);
      expect(textboxes2[8].value).toBe(mockDataInsert[1].environmentalInformation);
      expect(textboxes2[9].value).toBe(mockDataInsert[1].authenticationFlag);
      expect(textboxes2[10].value).toBe(mockDataInsert[1].groupCorporateCode);
      expect(textboxes2[11].value).toBe(mockDataInsert[1].integrationPattern);
      expect(textboxes2[12].value).toBe(mockDataInsert[1].hulftid);
    }, {timeout: 1000})

    act(() => {
      fireEvent.click(cancelButton)
    })

    await waitFor(() => {
      expect(mockInsertInventoryRecordArray).not.toHaveBeenCalled();
      expect(mockGetAllInventory).toHaveBeenCalled();
      const rows = within(tableWrapper!).queryAllByRole('row');
      expect(rows.length).toBeLessThan(3);
    })

  }
});

it('T0021: Check 複数削除 body structure - It should show the control buttons for the 複数削除 mode and enable the row selection column', async () => {

  const mockData = mockDataCreator(1);

  // Mock the API response
  mockGetAllInventory.mockResolvedValue({
    data: mockData,
    success: true,
    total: mockData.length,
  });

  const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

  // Wait for the table to load
  let tableWrapper: HTMLElement | null = null;
  await waitFor(() => {
    tableWrapper = container.querySelector('.ant-table-wrapper');
    expect(tableWrapper).toBeTruthy();
  }, { timeout: 1000 });

  // Verify API was called
  expect(mockGetAllInventory).toHaveBeenCalled();

  if (tableWrapper) {
    // Wait for the data to be loaded and rendered
    await waitFor(() => {
      // Find all rows in the table body
      const rows = within(tableWrapper!).queryAllByRole('row');
      // First row is header, so we expect at least 2 rows (header + data)
      expect(rows.length).toBeGreaterThan(1);
    }, { timeout: 1000 });

    const rows = within(tableWrapper!).queryAllByRole('row');
    // Find and click the 新規登録 button
    const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
    expect(toolbar).toBeTruthy();

    const multipleDeleteButton = await within(toolbar!).findByText(/複数削除/i, {}, {timeout: 1000});
    expect(multipleDeleteButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleDeleteButton);
    });

    // check control buttons

    await waitFor(async () => {
      const insertButton = await within(toolbar!).findByText(/削除/i, {}, {timeout: 1000});
      expect(insertButton).toBeTruthy();
      const cancelButton = await within(toolbar!).findByText(/キャンセル/i, {}, {timeout: 1000});
      expect(cancelButton).toBeTruthy();
      const checkbox = rows[1].querySelectorAll('input.ant-checkbox-input');
      expect(checkbox.length).toBe(1);
    }, { timeout: 1000})


  }
});

it('T0022: Check 複数削除 functionality 削除 - It should make 2 calls to the API: delete multiple records and get all records', async () => {
  const mockData = mockDataCreator(2);

  // Mock the API responses
  mockGetAllInventory.mockResolvedValue({
    data: mockData,
    success: true,
    total: mockData.length,
  });

  mockDeleteInventoryRecordArray.mockResolvedValue({
    success: true,
    message: 'Records deleted successfully'
  });

  const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

  // Wait for the table to load
  let tableWrapper: HTMLElement | null = null;
  await waitFor(() => {
    tableWrapper = container.querySelector('.ant-table-wrapper');
    expect(tableWrapper).toBeTruthy();
  }, { timeout: 1000 });

  // Verify initial API call
  expect(mockGetAllInventory).toHaveBeenCalled();

  if (tableWrapper) {
    // Wait for the data to be loaded and rendered
    await waitFor(() => {
      const rows = within(tableWrapper!).queryAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    }, { timeout: 1000 });

    const rows = within(tableWrapper!).queryAllByRole('row');
    
    // Find and click the 複数削除 button
    const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
    expect(toolbar).toBeTruthy();

    const multipleDeleteButton = await within(toolbar!).findByText(/複数削除/i, {}, {timeout: 1000});
    expect(multipleDeleteButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleDeleteButton);
    });

    // Check that checkboxes are visible and select them
    await waitFor(async () => {
      const checkboxes = rows[1].querySelectorAll('input.ant-checkbox-input');
      expect(checkboxes.length).toBeGreaterThan(0);
      
      // Select all checkboxes
      for (let i = 1; i < rows.length; i++) {
        const checkbox = rows[i].querySelector('input.ant-checkbox-input');
        await act(async () => {
          fireEvent.click(checkbox!);
        });
      }
    }, { timeout: 1000 });

    // Find and click the 削除 button
    const deleteButton = await within(toolbar!).findByText(/削除/i, {}, {timeout: 1000});
    expect(deleteButton).toBeTruthy();
    const cancelButton = within(toolbar!).queryByText(/キャンセル/i);
    expect(cancelButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Verify the delete API was called with correct parameters
    await waitFor(() => {
      expect(mockDeleteInventoryRecordArray).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            ...mockData[0]
          }),
          expect.objectContaining({
            ...mockData[1]
          }),

        ])
      );
      // Verify get all records was called after delete
      expect(mockGetAllInventory).toHaveBeenCalledTimes(3);
      
      // Verify we exited the multiple delete mode
      expect(cancelButton).not.toBeInTheDocument();
    }, { timeout: 1000 });
  }
});

it('T0023: Check 複数削除 functionality キャンセル - It should exit the 複数削除 mode and refresh the data', async () => {
  const mockData = mockDataCreator(2);

  // Mock the API responses
  mockGetAllInventory.mockResolvedValue({
    data: mockData,
    success: true,
    total: mockData.length,
  });

  const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

  // Wait for the table to load
  let tableWrapper: HTMLElement | null = null;
  await waitFor(() => {
    tableWrapper = container.querySelector('.ant-table-wrapper');
    expect(tableWrapper).toBeTruthy();
  }, { timeout: 1000 });

  // Verify initial API call
  expect(mockGetAllInventory).toHaveBeenCalled();

  if (tableWrapper) {
    // Wait for the data to be loaded and rendered
    await waitFor(() => {
      const rows = within(tableWrapper!).queryAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    }, { timeout: 1000 });

    const rows = within(tableWrapper!).queryAllByRole('row');
    
    // Find and click the 複数削除 button
    const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
    expect(toolbar).toBeTruthy();

    const multipleDeleteButton = await within(toolbar!).findByText(/複数削除/i, {}, {timeout: 1000});
    expect(multipleDeleteButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleDeleteButton);
    });

    // Check that checkboxes are visible and select them
    await waitFor(async () => {
      const checkboxes = rows[1].querySelectorAll('input.ant-checkbox-input');
      expect(checkboxes.length).toBeGreaterThan(0);
      
      // Select all checkboxes
      for (let i = 1; i < rows.length; i++) {
        const checkbox = rows[i].querySelector('input.ant-checkbox-input');
        await act(async () => {
          fireEvent.click(checkbox!);
        });
      }
    }, { timeout: 1000 });

    // Find and click the キャンセル button
    const cancelButton = await within(toolbar!).findByText(/キャンセル/i, {}, {timeout: 1000});
    expect(cancelButton).toBeTruthy();
    const deleteButton = within(toolbar!).queryByText(/削除/i);
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Verify the delete API was NOT called
    await waitFor(() => {
      expect(mockDeleteInventoryRecordArray).not.toHaveBeenCalled();
      
      // Verify get all records was called again
      expect(mockGetAllInventory).toHaveBeenCalledTimes(3);
      
      // Verify we exited the multiple delete mode
      expect(deleteButton).not.toBeInTheDocument();
      expect(cancelButton).not.toBeInTheDocument();
    }, { timeout: 1000 });
  }
});

it('T0024: Check 複数削除 functionality error handling 削除 - It should show error messages when deletion fails', async () => {
  const mockData = mockDataCreator(2);

  // Mock the API responses
  mockGetAllInventory.mockResolvedValue({
    data: mockData,
    success: true,
    total: mockData.length,
  });

  // Mock error response
  const errorResponse = {
    code: 400,
    message: "工場マスタの一括削除中にエラーが発生しました",
    data: null,
    error: {
      details: {
        ok_records: [],
        error_records: [
          {
            level: "E",
            message: "Record not found",
            detail: "A record with the specified primary key does not exist",
            code: "NotFoundError",
            record: {
              company_code: "string",
              previous_factory_code: "string",
              product_factory_code: "string",
              start_operation_date: "2025-12-09",
              end_operation_date: "2025-12-09",
              previous_factory_name: "string",
              product_factory_name: "string",
              material_department_code: "string",
              environmental_information: "string",
              authentication_flag: "string",
              group_corporate_code: "string",
              integration_pattern: "string",
              hulftid: "string"
            }
          }
        ]
      }
    }
  };

  mockDeleteInventoryRecordArray.mockRejectedValue({
    response: {
      data: errorResponse
    }
  });

  const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

  // Wait for the table to load
  let tableWrapper: HTMLElement | null = null;
  await waitFor(() => {
    tableWrapper = container.querySelector('.ant-table-wrapper');
    expect(tableWrapper).toBeTruthy();
  }, { timeout: 1000 });

  // Verify initial API call
  expect(mockGetAllInventory).toHaveBeenCalled();

  if (tableWrapper) {
    // Wait for the data to be loaded and rendered
    await waitFor(() => {
      const rows = within(tableWrapper!).queryAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    }, { timeout: 1000 });

    const rows = within(tableWrapper!).queryAllByRole('row');
    
    // Find and click the 複数削除 button
    const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
    expect(toolbar).toBeTruthy();

    const multipleDeleteButton = await within(toolbar!).findByText(/複数削除/i, {}, {timeout: 1000});
    expect(multipleDeleteButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleDeleteButton);
    });

    // Check that checkboxes are visible and select them
    await waitFor(async () => {
      const checkboxes = rows[1].querySelectorAll('input.ant-checkbox-input');
      expect(checkboxes.length).toBeGreaterThan(0);
      
      // Select all checkboxes
      for (let i = 1; i < rows.length; i++) {
        const checkbox = rows[i].querySelector('input.ant-checkbox-input');
        await act(async () => {
          fireEvent.click(checkbox!);
        });
      }
    }, { timeout: 1000 });

    // Find and click the 削除 button
    const deleteButton = await within(toolbar!).findByText(/削除/i, {}, {timeout: 1000});
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Verify the delete API was called with correct parameters
    await waitFor(() => {
      expect(mockDeleteInventoryRecordArray).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            ...mockData[0]
          }),
          expect.objectContaining({
            ...mockData[1]
          }),

        ])
      );
      
      // Verify error message is displayed
      const errorMessage = screen.getByText(/エラーがありました/i);
      expect(errorMessage).toBeTruthy();
      
      // Verify we're still in delete mode
      const cancelButton = within(toolbar!).queryByText(/キャンセル/i);
      expect(cancelButton).toBeTruthy();
    }, { timeout: 1000 });
  }
});

})

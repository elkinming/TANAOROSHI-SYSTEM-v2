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
  const mockCheckIntegrity = apiModule.backendIntegrityCheck as jest.Mock;
  const mockAddRecord = apiModule.addInventoryRecord as jest.Mock;
  const mockUpdateRecord = apiModule.updateInventoryRecord as jest.Mock;
  const mockUpdateMultipleRecord = apiModule.updateInventoryRecordBatch as jest.Mock;


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


it('T0013: Check 更新 form functionality キャンセル - It should close the form modal without making API calls', async () => {

  const mockData = [
    {
      id: '1',
      companyCode: 'COMP',
      previousFactoryCode: 'FACT',
      productFactoryCode: 'PROD',
      startOperationDate: '2023-01-01',
      endOperationDate: '2023-12-31',
      previousFactoryName: 'Factory 1',
      productFactoryName: 'Product Factory 1',
      materialDepartmentCode: 'DEPT',
      environmentalInformation: 'Info 1',
      authenticationFlag: 'Y',
      groupCorporateCode: 'CORP',
      integrationPattern: 'Pattern 1',
      hulftid: 'HULFTID',
    }
  ];

  // Mock the API response
  mockGetAllInventory.mockResolvedValue({
    data: mockData,
    success: true,
    total: mockData.length,
  });

  mockCheckIntegrity.mockResolvedValue({
    data: { success: true, message: 'Integrity check passed' }
  });

  mockUpdateRecord.mockResolvedValue({
    data: { success: true, message: 'Record added successfully' }
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

    // Find the edit button (pencil icon) in the action column
    const editButton = await within(rows[1]).findByRole('button', { name: /edit/i });
    expect(editButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(editButton);
    });

    // Wait for the modal to appear
    let modal: HTMLElement | null = null;
    await waitFor(() => {
      modal = document.querySelector('.ant-modal');
      expect(modal).toBeTruthy();
    }, { timeout: 1000 });

    const modalContent = within(modal!);


    // Test 4-character limit fields
    const fourCharFields = [
      '企業コード',
      'マテリアル部署コード'
    ];

    for (const label of fourCharFields) {
      const formItem = await waitFor(() =>
        modalContent.getByText(label).closest('.ant-form-item')
      );
      expect(formItem).toBeTruthy();

      if (formItem) {
        const input = within(formItem as HTMLElement).getByRole('textbox') as HTMLInputElement;

        // Test that the form's onChange handler enforces the limit
        await act(async () => { fireEvent.change(input, { target: { value: 'test' } }); });
        expect(input.value).toHaveLength(4);        expect(input.value).toBe('test');
      }
    }

    // Test 100-character limit fields
    const hundredCharFields = [
      '従来工場名',
      '商品工場名',
      '連携パターン',
      'HULFTID',
      '環境情報',
      '認証フラグ'
    ];

    for (const label of hundredCharFields) {
      const formItem = await waitFor(() =>
        modalContent.getByText(label).closest('.ant-form-item')
      );
      expect(formItem).toBeTruthy();

      if (formItem) {
        const input = within(formItem as HTMLElement).getByRole('textbox') as HTMLInputElement;

        // Test max length of 100 characters
        await act(async () => {
          fireEvent.change(input, { target: { value: 'long test' } });
        });

        expect(input.value).toBe('long test');

      }
    }

    const cancelButton = await modalContent.findByRole('button', { name: /キャンセル/i });
    expect(cancelButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Verify the modal is closed
    await waitFor(() => {
      expect(document.querySelector('.ant-modal')).not.toBeVisible();
    }, { timeout: 1000 });

    // Verify no API calls were made
    expect(mockCheckIntegrity).not.toHaveBeenCalled();
    expect(mockUpdateRecord).not.toHaveBeenCalled();


  }
});

it('T0014: Check 複数更新 body structure - It should show the control buttons and editable textboxes inside the table', async () => {

  const mockData = [
    {
      id: '1',
      companyCode: 'COMP',
      previousFactoryCode: 'FACT',
      productFactoryCode: 'PROD',
      startOperationDate: '2023-01-01',
      endOperationDate: '2023-12-31',
      previousFactoryName: 'Factory 1',
      productFactoryName: 'Product Factory 1',
      materialDepartmentCode: 'DEPT',
      environmentalInformation: 'Info 1',
      authenticationFlag: 'Y',
      groupCorporateCode: 'CORP',
      integrationPattern: 'Pattern 1',
      hulftid: 'HULFTID',
    }
  ];

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

    const multipleEditButton = await within(toolbar!).findByText(/複数更新/i);
    expect(multipleEditButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleEditButton);
    });

    // check control buttons
    const cancelButton = await within(toolbar!).findByText(/キャンセル/i);
    const saveButton = await within(toolbar!).findByText(/保存/i);
    expect(cancelButton).toBeTruthy();
    expect(saveButton).toBeTruthy();

    // check editable textboxes
    const textboxValues = [
      'Factory 1',
      'Product Factory 1',
      'DEPT',
      'Info 1',
      'Y',
      'CORP',
      'Pattern 1',
      'HULFTID',
    ];

    for (const label of textboxValues) {
      const formItem = await within(rows[1]).findByDisplayValue(label)
      expect(formItem).toBeTruthy();
    }

  }
});

it('T0015: Check 複数更新 functionality 保存 - It should make 2 calls to the API: Update multiple records and get all records', async () => {

  const mockDataAll = mockDataCreator(4);
  const mockDataInitial = mockDataAll.slice(0,2);
  const mockDataFinal = mockDataAll.slice(2,4);

  // Mock the API response
  mockGetAllInventory.mockResolvedValue({
    data: mockDataInitial,
    success: true,
    total: mockDataInitial.length,
  });

  mockUpdateMultipleRecord.mockResolvedValue({
    data: mockDataFinal,
    success: true,
    total: mockDataFinal.length,
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

    const multipleEditButton = await within(toolbar!).findByText(/複数更新/i);
    expect(multipleEditButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleEditButton);
    });

    // check control buttons
    const saveButton = await within(toolbar!).findByText(/保存/i);
    expect(saveButton).toBeTruthy();

    
    for (let i = 0; i < 2; i++){

      const formItem1 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].previousFactoryName)).closest('input')
      const formItem2 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].productFactoryName)).closest('input')
      const formItem3 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].materialDepartmentCode)).closest('input')
      const formItem4 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].environmentalInformation)).closest('input')
      const formItem5 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].authenticationFlag)).closest('input')
      const formItem6 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].groupCorporateCode)).closest('input')
      const formItem7 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].integrationPattern)).closest('input')
      const formItem8 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].hulftid)).closest('input')


      await act(async () => {
        fireEvent.change(formItem1!, { target: { value: mockDataFinal[i].previousFactoryName } });
        fireEvent.change(formItem2!, { target: { value: mockDataFinal[i].productFactoryName } });
        fireEvent.change(formItem3!, { target: { value: mockDataFinal[i].materialDepartmentCode } });
        fireEvent.change(formItem4!, { target: { value: mockDataFinal[i].environmentalInformation } });
        fireEvent.change(formItem5!, { target: { value: mockDataFinal[i].authenticationFlag } });
        fireEvent.change(formItem6!, { target: { value: mockDataFinal[i].groupCorporateCode } });
        fireEvent.change(formItem7!, { target: { value: mockDataFinal[i].integrationPattern } });
        fireEvent.change(formItem8!, { target: { value: mockDataFinal[i].hulftid } });
      });

      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].previousFactoryName);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].productFactoryName);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].materialDepartmentCode);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].environmentalInformation);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].authenticationFlag);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].groupCorporateCode);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].integrationPattern);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].hulftid);
      
    }

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(mockUpdateMultipleRecord).toHaveBeenCalledTimes(1);
    expect(mockUpdateMultipleRecord).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          previousFactoryName: mockDataFinal[0].previousFactoryName,
          productFactoryName: mockDataFinal[0].productFactoryName,
          materialDepartmentCode: mockDataFinal[0].materialDepartmentCode,
          environmentalInformation: mockDataFinal[0].environmentalInformation,
          authenticationFlag: mockDataFinal[0].authenticationFlag,
          groupCorporateCode: mockDataFinal[0].groupCorporateCode,
          integrationPattern: mockDataFinal[0].integrationPattern,
          hulftid: mockDataFinal[0].hulftid,
        }),
        expect.objectContaining({
          previousFactoryName: mockDataFinal[1].previousFactoryName,
          productFactoryName: mockDataFinal[1].productFactoryName,
          materialDepartmentCode: mockDataFinal[1].materialDepartmentCode,
          environmentalInformation: mockDataFinal[1].environmentalInformation,
          authenticationFlag: mockDataFinal[1].authenticationFlag,
          groupCorporateCode: mockDataFinal[1].groupCorporateCode,
          integrationPattern: mockDataFinal[1].integrationPattern,
          hulftid: mockDataFinal[1].hulftid,
        }),
      ])
    );

    expect(mockGetAllInventory).toHaveBeenCalledTimes(3);
    expect(saveButton).not.toBeVisible();

  }
});

it('T0016: Check 複数更新 functionality キャンセル - It should exit the editable mode, also it should make a API call for getting all records', async () => {

  const mockDataAll = mockDataCreator(4);
  const mockDataInitial = mockDataAll.slice(0,2);
  const mockDataFinal = mockDataAll.slice(2,4);

  // Mock the API response
  mockGetAllInventory.mockResolvedValue({
    data: mockDataInitial,
    success: true,
    total: mockDataInitial.length,
  });

  mockUpdateMultipleRecord.mockResolvedValue({
    data: mockDataFinal,
    success: true,
    total: mockDataFinal.length,
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

    const multipleEditButton = await within(toolbar!).findByText(/複数更新/i);
    expect(multipleEditButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleEditButton);
    });

    // check control buttons
    const cancelButton = await within(toolbar!).findByText(/キャンセル/i);
    expect(cancelButton).toBeTruthy();
    const saveButton = await within(toolbar!).findByText(/保存/i);
    expect(saveButton).toBeTruthy();

    for (let i = 0; i < 2; i++){

      const formItem1 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].previousFactoryName)).closest('input')
      const formItem2 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].productFactoryName)).closest('input')
      const formItem3 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].materialDepartmentCode)).closest('input')
      const formItem4 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].environmentalInformation)).closest('input')
      const formItem5 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].authenticationFlag)).closest('input')
      const formItem6 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].groupCorporateCode)).closest('input')
      const formItem7 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].integrationPattern)).closest('input')
      const formItem8 = (await within(rows[i + 1]).findByDisplayValue(mockDataInitial[i].hulftid)).closest('input')


      await act(async () => {
        fireEvent.change(formItem1!, { target: { value: mockDataFinal[i].previousFactoryName } });
        fireEvent.change(formItem2!, { target: { value: mockDataFinal[i].productFactoryName } });
        fireEvent.change(formItem3!, { target: { value: mockDataFinal[i].materialDepartmentCode } });
        fireEvent.change(formItem4!, { target: { value: mockDataFinal[i].environmentalInformation } });
        fireEvent.change(formItem5!, { target: { value: mockDataFinal[i].authenticationFlag } });
        fireEvent.change(formItem6!, { target: { value: mockDataFinal[i].groupCorporateCode } });
        fireEvent.change(formItem7!, { target: { value: mockDataFinal[i].integrationPattern } });
        fireEvent.change(formItem8!, { target: { value: mockDataFinal[i].hulftid } });
      });

      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].previousFactoryName);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].productFactoryName);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].materialDepartmentCode);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].environmentalInformation);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].authenticationFlag);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].groupCorporateCode);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].integrationPattern);
      await within(rows[i + 1]).findByDisplayValue(mockDataFinal[i].hulftid);
      
    }

    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(mockUpdateMultipleRecord).not.toHaveBeenCalled();
    expect(mockGetAllInventory).toHaveBeenCalledTimes(3);

    expect(saveButton).not.toBeVisible();
    expect(cancelButton).not.toBeVisible();
    

  }
});

it('T0017: Check 複数登録 body structure - It should show the control buttons for the 複数登録 mode', async () => {

  const mockData:any[] = [];

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

    const multipleRegisterButton = await within(toolbar!).findByText(/複数登録/i);
    expect(multipleRegisterButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleRegisterButton);
    });

    // check control buttons
    const cancelButton = await within(toolbar!).findByText(/キャンセル/i);
    const saveButton = await within(toolbar!).findByText(/保存/i);
    const insertButton = await within(toolbar!).findByText(/新規登録/i);
    expect(cancelButton).toBeTruthy();
    expect(saveButton).toBeTruthy();
    expect(insertButton).toBeTruthy();

  }
});

it('T0018: Check 複数登録 functionality 新規登録 - It should add to the table two new row with editable textboxes in all columns.', async () => {

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


    // Find and click the 新規登録 button
    const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
    expect(toolbar).toBeTruthy();

    const multipleRegisterButton = await within(toolbar!).findByText(/複数登録/i);
    expect(multipleRegisterButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(multipleRegisterButton);
    });

    // check control buttons

    const insertButton = await within(toolbar!).findByText(/新規登録/i);
    expect(insertButton).toBeTruthy();

    await act(async () => {
      fireEvent.click(insertButton);
    });

    waitFor(() => {
      const rows = within(tableWrapper!).queryAllByRole('row');
      expect(rows.length).toBeGreaterThan(2);
    }, {timeout: 1000})

    await act(async () => {
      fireEvent.click(insertButton);
    });

    waitFor(() => {
      const rows = within(tableWrapper!).queryAllByRole('row');
      expect(rows.length).toBeGreaterThan(3);
    }, {timeout: 1000})

    const rows = within(tableWrapper!).queryAllByRole('row');

    const texboxes1 = rows[1].querySelectorAll('input');
    expect(texboxes1.length).toBe(13);
    const texboxes2 = rows[2].querySelectorAll('input');
    expect(texboxes2.length).toBe(13);


  }
});

})

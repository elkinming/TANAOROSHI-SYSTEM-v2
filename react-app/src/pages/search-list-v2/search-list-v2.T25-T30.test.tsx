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

it('T0025: Check 複数登録 functionality error handling 保存 - It should show error messages when creation fails', async () => {
  const mockData = mockDataCreator(1);
  const mockDataInsert = mockDataCreator(2).map(item => ({
    ...item,
    companyCode: 'stri', // Using values that match the error response
    previousFactoryCode: 'stri',
    productFactoryCode: 'stri',
    startOperationDate: '2025-12-09',
    endOperationDate: '2025-12-09'
  }));

  // Mock initial data
  mockGetAllInventory.mockResolvedValue({
    data: mockData,
    success: true,
    total: mockData.length,
  });

  // Mock error response
  const errorResponse = {
    code: 400,
    message: "工場マスタの一括作成中にエラーが発生しました",
    data: null,
    error: {
      details: {
        ok_records: [],
        error_records: [
          {
            level: "E",
            message: "llave duplicada viola restricción de unicidad «tb_inventory_pk»\nDETAIL:  Ya existe la llave (company_code, previous_factory_code, product_factory_code, start_operation_date, end_operation_date)=(stri, stri, stri, 2025-12-09, 2025-12-09).\n",
            detail: "llave duplicada viola restricción de unicidad «tb_inventory_pk»\nDETAIL:  Ya existe la llave (company_code, previous_factory_code, product_factory_code, start_operation_date, end_operation_date)=(stri, stri, stri, 2025-12-09, 2025-12-09).\n",
            code: "PG23505",
            record: {
              company_code: "stri",
              previous_factory_code: "stri",
              product_factory_code: "stri",
              start_operation_date: "2025-12-09",
              end_operation_date: "2025-12-09",
              previous_factory_name: "string",
              product_factory_name: "string",
              material_department_code: "stri",
              environmental_information: "string",
              authentication_flag: "string",
              group_corporate_code: "stri",
              integration_pattern: "string",
              hulftid: "string"
            }
          },
          {
            level: "E",
            message: "el valor es demasiado largo para el tipo character varying(4)\n",
            detail: "el valor es demasiado largo para el tipo character varying(4)\n",
            code: "PG22001",
            record: {
              company_code: "stridsa",
              previous_factory_code: "stri",
              product_factory_code: "stri",
              start_operation_date: "2025-12-09",
              end_operation_date: "2025-12-09",
              previous_factory_name: "string",
              product_factory_name: "string",
              material_department_code: "stri",
              environmental_information: "string",
              authentication_flag: "string",
              group_corporate_code: "stridsa",
              integration_pattern: "string",
              hulftid: "string"
            }
          }
        ]
      }
    }
  };

  // Mock the API to reject with the error response
  mockInsertInventoryRecordArray.mockRejectedValue({
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

  // Find and click the 複数登録 button
  const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
  expect(toolbar).toBeTruthy();

  const multipleRegisterButton = await within(toolbar!).findByText(/複数登録/i, {}, {timeout: 1000});
  expect(multipleRegisterButton).toBeTruthy();

  await act(async () => {
    fireEvent.click(multipleRegisterButton);
  });

  // Check control buttons
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
  expect(rows.length).toBeGreaterThan(3);
  
  // Fill in the first row
  const fillRow = async (rowIndex: number, data: any) => {
    // expect(rows.length).toBeGreaterThan(3);
    // console.log(rowIndex);
    const inputs = rows[rowIndex].querySelectorAll('input');
    expect(inputs.length).toBe(13);
    await act(async () => {
      fireEvent.change(inputs[0], { target: { value: data.companyCode } });
      fireEvent.change(inputs[1], { target: { value: data.previousFactoryCode } });
      fireEvent.change(inputs[2], { target: { value: data.productFactoryCode } });
      fireEvent.change(inputs[3], { target: { value: data.startOperationDate } });
      fireEvent.change(inputs[4], { target: { value: data.endOperationDate } });
      fireEvent.change(inputs[5], { target: { value: data.previousFactoryName } });
      fireEvent.change(inputs[6], { target: { value: data.productFactoryName } });
      fireEvent.change(inputs[7], { target: { value: data.materialDepartmentCode } });
      fireEvent.change(inputs[8], { target: { value: data.environmentalInformation } });
      fireEvent.change(inputs[9], { target: { value: data.authenticationFlag } });
      fireEvent.change(inputs[10], { target: { value: data.groupCorporateCode } });
      fireEvent.change(inputs[11], { target: { value: data.integrationPattern } });
      fireEvent.change(inputs[12], { target: { value: data.hulftid } });
    });
  };

  // Fill both rows with data
  await fillRow(1, mockDataInsert[0]);
  await fillRow(2, mockDataInsert[1]);

  // Click the save button
  await act(async () => {
    fireEvent.click(saveButton);
  });

  // Verify the API was called with the correct data
  await waitFor(() => {
    expect(mockInsertInventoryRecordArray).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          companyCode: mockDataInsert[0].companyCode,
          previousFactoryCode: mockDataInsert[0].previousFactoryCode,
          productFactoryCode: mockDataInsert[0].productFactoryCode
        }),
        expect.objectContaining({
          companyCode: mockDataInsert[1].companyCode,
          previousFactoryCode: mockDataInsert[1].previousFactoryCode,
          productFactoryCode: mockDataInsert[1].productFactoryCode
        })
      ])
    );
  }, { timeout: 1000 });

  // Verify error message is displayed
  await waitFor(() => {
    const errorMessage1 = screen.getByText(/データは大きすぎます/i);
    expect(errorMessage1).toBeTruthy();
    
    // Verify error details are shown
    const errorMessage2 = screen.getByText(/PK重複/i);
    expect(errorMessage2).toBeTruthy();
    
  }, { timeout: 1000 });
});

it('T0026: Check 複数更新 functionality error handling 保存 - It should show error messages when update fails', async () => {
  const mockData = mockDataCreator(3);
  const mockDataInitial = mockData.slice(0,2);
  const mockDataUpdate = mockData.slice(2,3);

  // Mock initial data
  mockGetAllInventory.mockResolvedValue({
    data: mockDataInitial,
    success: true,
    total: mockData.length,
  });

  // Mock error response
  const errorResponse = {
    code: 400,
    message: "工場マスタの一括更新中にエラーが発生しました",
    data: null,
    error: {
      details: {
        ok_records: [],
        error_records: [
          {
            level: "E",
            message: "llave duplicada viola restricción de unicidad «tb_inventory_pk»\nDETAIL:  Ya existe la llave (company_code, previous_factory_code, product_factory_code, start_operation_date, end_operation_date)=(stri, stri, stri, 2025-12-09, 2025-12-09).\n",
            detail: "llave duplicada viola restricción de unicidad «tb_inventory_pk»\nDETAIL:  Ya existe la llave (company_code, previous_factory_code, product_factory_code, start_operation_date, end_operation_date)=(stri, stri, stri, 2025-12-09, 2025-12-09).\n",
            code: "PG23505",
            record: {
              company_code: "stri",
              previous_factory_code: "stri",
              product_factory_code: "stri",
              start_operation_date: "2025-12-09",
              end_operation_date: "2025-12-09",
              previous_factory_name: "string",
              product_factory_name: "string",
              material_department_code: "stri",
              environmental_information: "string",
              authentication_flag: "string",
              group_corporate_code: "stri",
              integration_pattern: "string",
              hulftid: "string"
            }
          },
          {
            level: "E",
            message: "el valor es demasiado largo para el tipo character varying(4)\n",
            detail: "el valor es demasiado largo para el tipo character varying(4)\n",
            code: "PG22001",
            record: {
              company_code: "stridsa",
              previous_factory_code: "stri",
              product_factory_code: "stri",
              start_operation_date: "2025-12-09",
              end_operation_date: "2025-12-09",
              previous_factory_name: "string",
              product_factory_name: "string",
              material_department_code: "stri",
              environmental_information: "string",
              authentication_flag: "string",
              group_corporate_code: "stridsa",
              integration_pattern: "string",
              hulftid: "string"
            }
          }
        ]
      }
    }
  };

  // Mock the API to reject with the error response
  mockUpdateMultipleRecord.mockRejectedValue({
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

  // Find and click the 複数更新 button
  const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
  expect(toolbar).toBeTruthy();

  const multipleUpdateButton = await within(toolbar!).findByText(/複数更新/i, {}, {timeout: 1000});
  expect(multipleUpdateButton).toBeTruthy();

  await act(async () => {
    fireEvent.click(multipleUpdateButton);
  });

  // Check control buttons
  const saveButton = await within(toolbar!).findByText(/保存/i, {}, {timeout: 1000});
  expect(saveButton).toBeTruthy();
  const cancelButton = await within(toolbar!).findByText(/キャンセル/i, {}, {timeout: 1000});
  expect(cancelButton).toBeTruthy();

  // Wait for the rows to be editable
  await waitFor(() => {
    const rows = within(tableWrapper!).queryAllByRole('row');
    expect(rows.length).toBeGreaterThan(2);
  }, {timeout: 1000});

  const rows = within(tableWrapper!).queryAllByRole('row');
  
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
        fireEvent.change(formItem1!, { target: { value: mockDataUpdate[0].previousFactoryName } });
        fireEvent.change(formItem2!, { target: { value: mockDataUpdate[0].productFactoryName } });
        fireEvent.change(formItem3!, { target: { value: mockDataUpdate[0].materialDepartmentCode } });
        fireEvent.change(formItem4!, { target: { value: mockDataUpdate[0].environmentalInformation } });
        fireEvent.change(formItem5!, { target: { value: mockDataUpdate[0].authenticationFlag } });
        fireEvent.change(formItem6!, { target: { value: mockDataUpdate[0].groupCorporateCode } });
        fireEvent.change(formItem7!, { target: { value: mockDataUpdate[0].integrationPattern } });
        fireEvent.change(formItem8!, { target: { value: mockDataUpdate[0].hulftid } });
      });

      await within(rows[i + 1]).findByDisplayValue(mockDataUpdate[0].previousFactoryName);
      await within(rows[i + 1]).findByDisplayValue(mockDataUpdate[0].productFactoryName);
      await within(rows[i + 1]).findByDisplayValue(mockDataUpdate[0].materialDepartmentCode);
      await within(rows[i + 1]).findByDisplayValue(mockDataUpdate[0].environmentalInformation);
      await within(rows[i + 1]).findByDisplayValue(mockDataUpdate[0].authenticationFlag);
      await within(rows[i + 1]).findByDisplayValue(mockDataUpdate[0].groupCorporateCode);
      await within(rows[i + 1]).findByDisplayValue(mockDataUpdate[0].integrationPattern);
      await within(rows[i + 1]).findByDisplayValue(mockDataUpdate[0].hulftid);
      
    }

  // Click the save button
  await act(async () => {
    fireEvent.click(saveButton);
    // console.log("Button Clicked");
  });

  // Verify the API was called with the correct data
  await waitFor(() => {
    expect(mockUpdateMultipleRecord).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          ...mockDataUpdate[0],
          companyCode: mockDataInitial[0].companyCode,
          previousFactoryCode: mockDataInitial[0].previousFactoryCode,
          productFactoryCode: mockDataInitial[0].productFactoryCode,
          startOperationDate: mockDataInitial[0].startOperationDate,
          endOperationDate: mockDataInitial[0].endOperationDate,
          id: mockDataInitial[0].id,
        }),
        expect.objectContaining({
          ...mockDataUpdate[0],
          companyCode: mockDataInitial[1].companyCode,
          previousFactoryCode: mockDataInitial[1].previousFactoryCode,
          productFactoryCode: mockDataInitial[1].productFactoryCode,
          startOperationDate: mockDataInitial[1].startOperationDate,
          endOperationDate: mockDataInitial[1].endOperationDate,
          id: mockDataInitial[1].id,
        })
      ])
      
    );
  }, { timeout: 1000 });

  // Verify error message is displayed
  await waitFor(() => {
    const errorMessage1 = screen.getByText(/データは大きすぎます/i);
    expect(errorMessage1).toBeTruthy();
    
    // Verify error details are shown
    const errorMessage2 = screen.getByText(/PK重複/i);
    expect(errorMessage2).toBeTruthy();
  }, { timeout: 1000 });
});

})

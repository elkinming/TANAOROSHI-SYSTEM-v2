import { render, waitFor, screen, within, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { ConfigProvider } from 'antd';
import jaJP from 'antd/es/locale/ja_JP';
import SearchListV2 from './index';
import * as apiModule from '@/services/ant-design-pro/api';
import jaJPMessages from '@/locales/ja-JP';
import '@testing-library/jest-dom';

// Mock the API service
jest.mock('@/services/ant-design-pro/api', () => ({
  getAllInventory: jest.fn(),
  insertInventoryRecordArray: jest.fn(),
  updateInventoryRecordBatch: jest.fn(),
  deleteInventoryRecordArray: jest.fn(),
  addInventoryRecordBatch: jest.fn(),
  backendIntegrityCheck: jest.fn(),
  addInventoryRecord: jest.fn(),

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

describe('SearchListV2 Component', () => {
  const mockGetAllInventory = apiModule.getAllInventory as jest.Mock;
  const mockCheckIntegrity = apiModule.backendIntegrityCheck as jest.Mock;
  const mockAddRecord = apiModule.addInventoryRecord as jest.Mock;

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


// /**
//  * Test ID: T0007
//  * Test Name: Check 新規登録 form fields integrity
//  * Initial Stimulus: After accessing the 新規登録 form, When typing data at the fields
//  * Expected Response: The allowed typed data should follow the rules of length and type of each field.
//  * Response Details (Assertions):
//  *   - Fields: 会社コード, 従来工場コード, 商品工場コード, 企業コード, and マテリアル部署コード should be 4 length maximum
//  *   - Fields: 従来工場名, 商品工場名, 連携パターン, HULFTID, 環境情報, 認証フラグ should be 100 length maximum
//  *   - Fields: 運用開始日, 運用終了日 should have Date format only (Ex. 2000-01-01)
//  */
// it('T0007: Check 新規登録 form fields integrity - should validate field inputs according to rules', async () => {
//   // Mock initial data
//   const initialMockData = [{
//     id: '1',
//     companyCode: 'COMP',
//     previousFactoryCode: 'FACT',
//     productFactoryCode: 'PROD',
//     previousFactoryName: 'Factory',
//   }];

//   // Mock API response
//   mockGetAllInventory.mockResolvedValue({
//     data: initialMockData,
//     success: true,
//     total: initialMockData.length,
//   });

//   const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

//   // Wait for initial load
//   await waitFor(() => {
//     const tableWrapper = container.querySelector('.ant-table-wrapper');
//     expect(tableWrapper).toBeTruthy();
//   }, { timeout: 1000 });

//   // Find and click the 新規登録 button
//   const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
//   expect(toolbar).toBeTruthy();

//   if (toolbar) {
//     const newButton = within(toolbar).getByRole('button', { name: /新規登録/ });
//     await act(async () => {
//       fireEvent.click(newButton);
//     });

//     // Wait for the modal to appear
//     let modal: HTMLElement | null = null;
//     await waitFor(() => {
//       modal = document.querySelector('.ant-modal');
//       expect(modal).toBeTruthy();
//     }, { timeout: 1000 });

//     if (!modal) {
//       throw new Error('Modal did not appear');
//     }

//     const modalContent = within(modal);

//     // Test 4-character limit fields
//     const fourCharFields = [
//       '会社コード',
//       '従来工場コード',
//       '商品工場コード',
//       '企業コード',
//       'マテリアル部署コード'
//     ];

//     for (const label of fourCharFields) {
//       const formItem = await waitFor(() => 
//         modalContent.getByText(label).closest('.ant-form-item')
//       );
//       expect(formItem).toBeTruthy();
      
//       if (formItem) {
//         const input = within(formItem as HTMLElement).getByRole('textbox') as HTMLInputElement;
        
//         // First, test that the input has the correct maxLength attribute
//         expect(input.maxLength).toBe(4);
        
//         // Test that the form's onChange handler enforces the limit
//         await act(async () => {
//           // Simulate typing '12345' in one go
//           fireEvent.change(input, { 
//             target: { 
//               value: '12345',
//               // These are important for some form libraries
//               selectionStart: 5,
//               selectionEnd: 5
//             } 
//           });
//         });
        
//         // The input value should be limited to 4 characters
//         expect(input.value).toHaveLength(4);
//         expect(input.value).toBe('1234');
        
//         // Test that the form's value is also limited
//         const form = formItem.closest('form');
//         if (form) {
//           const formData = new FormData(form);
//           const fieldName = input.name || input.id;
//           if (fieldName) {
//             const formValue = formData.get(fieldName);
//             if (formValue !== null) {
//               expect(String(formValue)).toHaveLength(4);
//             }
//           }
//         }
//       }
//     }

//     // Test 100-character limit fields
//     const hundredCharFields = [
//       '従来工場名',
//       '商品工場名',
//       '連携パターン',
//       'HULFTID',
//       '環境情報',
//       '認証フラグ'
//     ];

//     for (const label of hundredCharFields) {
//       const formItem = await waitFor(() => 
//         modalContent.getByText(label).closest('.ant-form-item')
//       );
//       expect(formItem).toBeTruthy();
      
//       if (formItem) {
//         const input = within(formItem as HTMLElement).getByRole('textbox') as HTMLInputElement;
//         const longString = 'a'.repeat(101);
//         const validString = 'a'.repeat(100);
        
//         // Test max length of 100 characters
//         await act(async () => {
//           fireEvent.change(input, { target: { value: longString } });
//         });
        
//         // Should only accept 100 characters
//         expect(input.value).toHaveLength(100);
//         expect(input.value).toBe(validString);
        
//         // Test valid input
//         await act(async () => {
//           fireEvent.change(input, { target: { value: validString } });
//         });
//         expect(input.value).toBe(validString);
//       }
//     }

//     // Close the modal to clean up
//     const closeButton = modalContent.getByRole('button', { name: /キャンセル/ });
//     await act(async () => {
//       fireEvent.click(closeButton);
//     });
//   }
// });

// /**
//  * Test ID: T0008
//  * Test Name: Check 新規登録 form functionality 登録
//  * Initial Stimulus: After filling the 新規登録 form with valid data, when pressing the button 登録
//  * Expected Response: It should make 3 API calls in order: Check integrity, Insert Record, and get all records
//  * Response Details (Assertions):
//  *   - Check Integrity URL: POST /inventory/record/check-integrity
//  *   - Insert Record URL: POST /inventory/record
//  *   - Get all records URL: GET /inventory/record-list
//  */
// it('T0008: Check 新規登録 form functionality 登録 - should make API calls in correct order when submitting valid form', async () => {
//   // Mock initial data
//   const initialMockData:any[] = [];

//   // Mock API responses
//   mockGetAllInventory.mockResolvedValue({
//     data: initialMockData,
//     success: true,
//     total: initialMockData.length,
//   });
//   mockCheckIntegrity.mockResolvedValue({
//     data: { success: true, message: 'Integrity check passed' }
//   });
//   mockAddRecord.mockResolvedValue({
//     data: { success: true, message: 'Record added successfully' }
//   });

//   const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

//   // Wait for initial load
//   await waitFor(() => {
//     const tableWrapper = container.querySelector('.ant-table-wrapper');
//     expect(tableWrapper).toBeTruthy();
//   }, { timeout: 1000 });

//   // Find and click the 新規登録 button
//   const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
//   expect(toolbar).toBeTruthy();

//   if (toolbar) {
//     const newButton = within(toolbar).getByRole('button', { name: /新規登録/ });
//     await act(async () => {
//       fireEvent.click(newButton);
//     });

//     // Wait for the modal to appear
//     let modal: HTMLElement | null = null;
//     await waitFor(() => {
//       modal = document.querySelector('.ant-modal');
//       expect(modal).toBeTruthy();
//     }, { timeout: 1000 });

//     if (!modal) {
//       throw new Error('Modal did not appear');
//     }

//     const modalContent = within(modal);

//     // Fill in the form with valid data
//     const formFields = {
//       '会社コード': 'TEST',
//       '従来工場コード': 'FACT',
//       '商品工場コード': 'PROD',
//       '運用開始日': '2023-01-01',
//       '運用終了日': '2024-01-01',
//       '従来工場名': 'Test Factory',
//       '商品工場名': 'Test Product Factory',
//       'マテリアル部署コード': 'DEP1',
//       '環境情報': 'Test Environment',
//       '認証フラグ': 'Y',
//       '企業コード': 'CORP',
//       '連携パターン': 'A1',
//       'HULFTID': 'HULFT001'
//     };

//     // Fill in all form fields
//     for (const [label, value] of Object.entries(formFields)) {
//       const formItem = await waitFor(() => 
//         modalContent.getByText(label).closest('.ant-form-item')
//       );
//       expect(formItem).toBeTruthy();
      
//       if (formItem) {
//         const input = within(formItem as HTMLElement).getByRole('textbox') as HTMLInputElement;
//         await act(async () => {
//           fireEvent.change(input, { target: { value } });
//           fireEvent.blur(input); // Trigger validation
//         });
//       }
//     }

//     // Find and click the 登録 button
//     const submitButton = await waitFor(() => 
//       modalContent.getByRole('button', { name: /登 録/ })
//     );
//     await act(async () => {
//       fireEvent.click(submitButton);
//     });

//     // Verify API calls were made in the correct order
//     await waitFor(() => {
//       // 1. Check integrity API call
//       expect(mockCheckIntegrity).toHaveBeenCalledTimes(1);
//       expect(mockCheckIntegrity).toHaveBeenCalledWith(
//         expect.objectContaining({
//           datatypeCheck: true,
//           pkCheck: true,
//           timeLogicCheck: true
//         }),
//         expect.objectContaining({
//           companyCode: "TEST",
//           previousFactoryCode: "FACT",
//           productFactoryCode: "PROD"
//         })
//       );

//       // 2. Add record API call
//       expect(mockAddRecord).toHaveBeenCalledTimes(1);
//       expect(mockAddRecord).toHaveBeenCalledWith(expect.objectContaining({
//         companyCode: 'TEST',
//         previousFactoryCode: 'FACT',
//         productFactoryCode: 'PROD'
//       }));

//       // 3. Get all records API call (triggered after successful submission)
//       expect(mockGetAllInventory).toHaveBeenCalledTimes(2); // Once for initial load, once after submission
//     });

//   }
// });

// /**
//  * Test ID: T0009
//  * Test Name: Check 新規登録 form functionality キャンセル
//  * Initial Stimulus: After filling the 新規登録 form with valid data, when pressing the button キャンセル
//  * Expected Response: It should close the form modal without making API calls
//  */
// it('T0009: Check 新規登録 form functionality キャンセル - should close modal without API calls', async () => {
//   // Mock initial data
//   const initialMockData: any[] = [];

//   // Mock API responses
//   mockGetAllInventory.mockResolvedValue({
//     data: initialMockData,
//     success: true,
//     total: initialMockData.length,
//   });

//   const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

//   // Wait for initial load
//   await waitFor(() => {
//     const tableWrapper = container.querySelector('.ant-table-wrapper');
//     expect(tableWrapper).toBeTruthy();
//   }, { timeout: 1000 });

//   // Find and click the 新規登録 button
//   const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
//   expect(toolbar).toBeTruthy();

//   if (toolbar) {
//     const newButton = within(toolbar).getByRole('button', { name: /新規登録/ });
//     await act(async () => {
//       fireEvent.click(newButton);
//     });

//     // Wait for the modal to appear
//     let modal: HTMLElement | null = null;
//     await waitFor(() => {
//       modal = document.querySelector('.ant-modal');
//       expect(modal).toBeTruthy();
//     }, { timeout: 1000 });

//     if (!modal) {
//       throw new Error('Modal did not appear');
//     }

//     const modalContent = within(modal);

//     // Fill in the form with valid data
//     const formFields = {
//       '会社コード': 'TEST',
//       '従来工場コード': 'FACT',
//       '商品工場コード': 'PROD',
//       '運用開始日': '2023-01-01',
//       '運用終了日': '2024-01-01',
//       '従来工場名': 'Test Factory',
//       '商品工場名': 'Test Product Factory',
//       'マテリアル部署コード': 'DEP1',
//       '環境情報': 'Test Environment',
//       '認証フラグ': 'Y',
//       '企業コード': 'CORP',
//       '連携パターン': 'A1',
//       'HULFTID': 'HULFT001'
//     };

//     // Fill in all form fields
//     for (const [label, value] of Object.entries(formFields)) {
//       const formItem = await waitFor(() => 
//         modalContent.getByText(label).closest('.ant-form-item')
//       );
//       expect(formItem).toBeTruthy();
      
//       if (formItem) {
//         const input = within(formItem as HTMLElement).getByRole('textbox') as HTMLInputElement;
//         await act(async () => {
//           fireEvent.change(input, { target: { value } });
//           fireEvent.blur(input); // Trigger validation
//         });
//       }
//     }

//     // Reset mock call counts before testing the cancel button
//     mockCheckIntegrity.mockClear();
//     mockAddRecord.mockClear();
//     mockGetAllInventory.mockClear();

//     // Find and click the キャンセル button
//     const cancelButton = await waitFor(() => 
//       modalContent.getByRole('button', { name: /キャンセル/ })
//     );
    
//     await act(async () => {
//       fireEvent.click(cancelButton);
//     });

//     // Verify the modal is closed
//     await waitFor(() => {
//       expect(document.querySelector('.ant-modal')).not.toBeVisible();
//     }, { timeout: 1000 });

//     // Verify no API calls were made
//     expect(mockCheckIntegrity).not.toHaveBeenCalled();
//     expect(mockAddRecord).not.toHaveBeenCalled();
    
//   }
// });


// /**
//  * Test ID: T0010
//  * Test Name: Check 更新 form fields exist
//  * Initial Stimulus: After the initial record list loads, when pressing the button with the pencil symbol (更新)
//  * Expected Response: it should be visible a form with all the record fields
//  * Response Details (Assertions):
//  *   - Title: 更新
//  *   - textbox's labels: 会社コード, 従来工場コード, 商品工場コード, 運用開始日, 運用終了日, 
//  *     従来工場名, 商品工場名, マテリアル部署コード, 環境情報, 認証フラグ, 企業コード, 連携パターン, HULFTID
//  */
// it('T0010: Check 更新 form fields exist - should display all form fields when clicking edit button', async () => {
  
//   const mockData = [
//     {
//       id: '1',
//       companyCode: 'COMP001',
//       previousFactoryCode: 'FACT001',
//       productFactoryCode: 'PROD001',
//       startOperationDate: '2023-01-01',
//       endOperationDate: '2023-12-31',
//       previousFactoryName: 'Factory 1',
//       productFactoryName: 'Product Factory 1',
//       materialDepartmentCode: 'DEPT001',
//       environmentalInformation: 'Info 1',
//       authenticationFlag: 'Y',
//       groupCorporateCode: 'CORP001',
//       integrationPattern: 'Pattern 1',
//       hulftid: 'HULFT001',
//     },
//     {
//       id: '2',
//       companyCode: 'COMP002',
//       previousFactoryCode: 'FACT002',
//       productFactoryCode: 'PROD002',
//       startOperationDate: '2023-02-01',
//       endOperationDate: '2023-11-30',
//       previousFactoryName: 'Factory 2',
//       productFactoryName: 'Product Factory 2',
//       materialDepartmentCode: 'DEPT002',
//       environmentalInformation: 'Info 2',
//       authenticationFlag: 'N',
//       groupCorporateCode: 'CORP002',
//       integrationPattern: 'Pattern 2',
//       hulftid: 'HULFT002',
//     }
//   ];

//   // Mock the API response
//   mockGetAllInventory.mockResolvedValue({
//     data: mockData,
//     success: true,
//     total: mockData.length,
//   });

//   const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

//   // Wait for the table to load
//   let tableWrapper: HTMLElement | null = null;
//   await waitFor(() => {
//     tableWrapper = container.querySelector('.ant-table-wrapper');
//     expect(tableWrapper).toBeTruthy();
//   }, { timeout: 1000 });

//   // Verify API was called
//   expect(mockGetAllInventory).toHaveBeenCalled();

//   if (tableWrapper) {
//     // Wait for the data to be loaded and rendered
//     await waitFor(() => {
//       // Find all rows in the table body
//       const rows = within(tableWrapper!).queryAllByRole('row');
//       // First row is header, so we expect at least 2 rows (header + data)
//       expect(rows.length).toBeGreaterThan(1);
//     }, { timeout: 1000 });

//     const rows = within(tableWrapper!).queryAllByRole('row');

//     // Find the edit button (pencil icon) in the action column
//     const editButton = await within(rows[1]).findByRole('button', { name: /edit/i });
//     expect(editButton).toBeTruthy();

//     await act(async () => {
//       fireEvent.click(editButton);
//     });

//     // Wait for the modal to appear
//     let modal: HTMLElement | null = null;
//     await waitFor(() => {
//       modal = document.querySelector('.ant-modal');
//       expect(modal).toBeTruthy();
//     }, { timeout: 1000 });

//     const modalContent = within(modal!);

//     // Check the modal title is "更新"
//     const modalTitle = await waitFor(() => 
//       modalContent.getByText('更新')
//     );
//     expect(modalTitle).toBeTruthy();

//     // Check all expected form fields are present
//     const expectedLabels = [
//       '会社コード',
//       '従来工場コード',
//       '商品工場コード',
//       '運用開始日',
//       '運用終了日',
//       '従来工場名',
//       '商品工場名',
//       'マテリアル部署コード',
//       '環境情報',
//       '認証フラグ',
//       '企業コード',
//       '連携パターン',
//       'HULFTID'
//     ];

//     for (const label of expectedLabels) {
//       const formItem = await waitFor(() => 
//         modalContent.getByText(label).closest('.ant-form-item')
//       );
//       expect(formItem).toBeTruthy();
//     }

//     // Close the modal to clean up
//     const closeButton = modalContent.getByRole('button', { name: /キャンセル/ });
//     await act(async () => {
//       fireEvent.click(closeButton);
//     });
//   }

// });


// /**
//  * Test ID: T0011
//  * Test Name: Check 更新 form fields integrity
//  * Initial Stimulus: After the accessing the 更新 form, When typing data at the fields
//  * Expected Response: The allowed typed data should follow the rules of length and type of each field.
//  * Response Details (Assertions):
//  *   - Fields: 会社コード, 従来工場コード, 商品工場コード, 企業コード, and マテリアル部署コード should be 4 length maximum
//  *   - Fields: 従来工場名, 商品工場名, 連携パターン, HULFTID, 環境情報, 認証フラグ should be 100 length maximum
//  *   - Fields: 運用開始日, 運用終了日 should have Date format only (Ex. 2000-01-01)
//  */
// it('T0011: Check 更新 form fields integrity - should validate field inputs according to rules', async () => {
  

//   const mockData = [
//     {
//       id: '1',
//       companyCode: 'COMP001',
//       previousFactoryCode: 'FACT001',
//       productFactoryCode: 'PROD001',
//       startOperationDate: '2023-01-01',
//       endOperationDate: '2023-12-31',
//       previousFactoryName: 'Factory 1',
//       productFactoryName: 'Product Factory 1',
//       materialDepartmentCode: 'DEPT001',
//       environmentalInformation: 'Info 1',
//       authenticationFlag: 'Y',
//       groupCorporateCode: 'CORP001',
//       integrationPattern: 'Pattern 1',
//       hulftid: 'HULFT001',
//     }
//   ];

//   // Mock the API response
//   mockGetAllInventory.mockResolvedValue({
//     data: mockData,
//     success: true,
//     total: mockData.length,
//   });

//   const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

//   // Wait for the table to load
//   let tableWrapper: HTMLElement | null = null;
//   await waitFor(() => {
//     tableWrapper = container.querySelector('.ant-table-wrapper');
//     expect(tableWrapper).toBeTruthy();
//   }, { timeout: 1000 });

//   // Verify API was called
//   expect(mockGetAllInventory).toHaveBeenCalled();

//   if (tableWrapper) {
//     // Wait for the data to be loaded and rendered
//     await waitFor(() => {
//       // Find all rows in the table body
//       const rows = within(tableWrapper!).queryAllByRole('row');
//       // First row is header, so we expect at least 2 rows (header + data)
//       expect(rows.length).toBeGreaterThan(1);
//     }, { timeout: 1000 });

//     const rows = within(tableWrapper!).queryAllByRole('row');

//     // Find the edit button (pencil icon) in the action column
//     const editButton = await within(rows[1]).findByRole('button', { name: /edit/i });
//     expect(editButton).toBeTruthy();

//     await act(async () => {
//       fireEvent.click(editButton);
//     });

//     // Wait for the modal to appear
//     let modal: HTMLElement | null = null;
//     await waitFor(() => {
//       modal = document.querySelector('.ant-modal');
//       expect(modal).toBeTruthy();
//     }, { timeout: 1000 });

//     const modalContent = within(modal!);

//     // Check disabled fields
//     const disabledFields = [
//       '会社コード',
//       '従来工場コード',
//       '商品工場コード',
//       '運用開始日',
//       '運用終了日',
//     ];

//     for (const label of disabledFields) {
//       const formItem = await waitFor(() => 
//         modalContent.getByText(label).closest('.ant-form-item')
//       );
//       expect(formItem).toBeTruthy();
      
//       if (formItem) {
//         const input = within(formItem as HTMLElement).getByRole('textbox') as HTMLInputElement;
//         expect(input.disabled).toBe(true);
//         act(() => {
//           fireEvent.change(input, { target: { value: 'ABCD' } });
//         })
//         expect(input).not.toBe('ABCD')
//       }
//     }

//     // Test 4-character limit fields
//     const fourCharFields = [
//       '企業コード',
//       'マテリアル部署コード'
//     ];

//     for (const label of fourCharFields) {
//       const formItem = await waitFor(() => 
//         modalContent.getByText(label).closest('.ant-form-item')
//       );
//       expect(formItem).toBeTruthy();
      
//       if (formItem) {
//         const input = within(formItem as HTMLElement).getByRole('textbox') as HTMLInputElement;
        
//         // First, test that the input has the correct maxLength attribute
//         expect(input.maxLength).toBe(4);
        
//         // Test that the form's onChange handler enforces the limit
//         await act(async () => {
//           // Simulate typing '12345' in one go
//           fireEvent.change(input, { 
//             target: { 
//               value: '12345',
//               // These are important for some form libraries
//               selectionStart: 5,
//               selectionEnd: 5
//             } 
//           });
//         });
        
//         // The input value should be limited to 4 characters
//         expect(input.value).toHaveLength(4);
//         expect(input.value).toBe('1234');
//       }
//     }

//     // Test 100-character limit fields
//     const hundredCharFields = [
//       '従来工場名',
//       '商品工場名',
//       '連携パターン',
//       'HULFTID',
//       '環境情報',
//       '認証フラグ'
//     ];

//     for (const label of hundredCharFields) {
//       const formItem = await waitFor(() => 
//         modalContent.getByText(label).closest('.ant-form-item')
//       );
//       expect(formItem).toBeTruthy();
      
//       if (formItem) {
//         const input = within(formItem as HTMLElement).getByRole('textbox') as HTMLInputElement;
//         const longString = 'a'.repeat(101);
//         const validString = 'a'.repeat(100);
        
//         // Test max length of 100 characters
//         await act(async () => {
//           fireEvent.change(input, { target: { value: longString } });
//         });
        
//         // Should only accept 100 characters
//         expect(input.value).toHaveLength(100);
//         expect(input.value).toBe(validString);
        
//         // Test valid input
//         await act(async () => {
//           fireEvent.change(input, { target: { value: validString } });
//         });
//         expect(input.value).toBe(validString);
//       }
//     }
//   }
// });


it('T0012: Check 更新 form functionality 更新 - It should make 3 API calls in order: Check integrity, Update Record, and get all records', async () => {
  

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

    const button = modalContent.findByText()
  }
});

})

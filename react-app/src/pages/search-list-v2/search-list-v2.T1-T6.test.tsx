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

  /**
   * Test ID: T0001
   * Test Name: Check Page Headers
   * Initial Stimulus: At the component initial load
   * Expected Response: it should be visible at the header the title and search bar
   * Response Details (Assertions):
   *   - the Title: 工場マスタ「V2」
   *   - the PG ID
   *   - 3 textboxes in the search section
   */
  it('T0001: Check Page Headers - should display title, PG ID, and 3 textboxes in search section on initial load', async () => {
    const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(mockGetAllInventory).toHaveBeenCalled();
    }, { timeout: 1000 });

    // Assertion 1: Verify the Title "工場マスタ「V2」" is visible
    await waitFor(() => {
      const titleElement = screen.getByText('工場マスタ「V2」');
      expect(titleElement).toBeTruthy();
    }, { timeout: 1000 });

    // Verify the title is visible
    expect(screen.getByText('工場マスタ「V2」')).toBeTruthy();

    // Assertion 2: Verify the PG ID is visible
    await waitFor(() => {
      const pgIdElement = screen.getByText(/PG ID : ABCD-1234/);
      expect(pgIdElement).toBeTruthy();
    }, { timeout: 1000 });

    // Verify the PG ID is visible (check for "PG ID : ABCD-1234" or just "ABCD-1234")
    const pgIdText = screen.getByText(/PG ID : ABCD-1234/);
    expect(pgIdText).toBeTruthy();

    // Assertion 3: Verify 3 textboxes in the search section
    await waitFor(() => {
      // The search form rendered by EditableProTable is wrapped by the .ant-pro-table-search class
      const searchWrapper = container.querySelector('.ant-pro-table-search');
      expect(searchWrapper).toBeTruthy();
    }, { timeout: 1000 });

    const searchWrapper = container.querySelector('.ant-pro-table-search') as HTMLElement | null;
    expect(searchWrapper).toBeTruthy();

    if (searchWrapper) {
      await waitFor(() => {
        const textboxes = within(searchWrapper).getAllByRole('textbox');
        expect(textboxes.length).toBe(3);
      }, { timeout: 1000 });
    }
  });

  /**
   * Test ID: T0002
   * Test Name: Check Page Body
   * Initial Stimulus: At the component initial load
   * Expected Response: it should be visible at the body: function buttons and the data table
   * Response Details (Assertions):
   *   - the function buttons: 新規登録、 ダウンロード、 アップロード、 複数更新、 複数登録、 複数削除
   *   - Table with headers: 会社コード, 従来工場コード, 商品工場コード, 運用開始日, 運用終了日,
   *     従来工場名, 商品工場名, マテリアル部署コード, 環境情報, 認証フラグ, 企業コード, 連携パターン, HULFTID
   */
  it('T0002: Check Page Body - should display function buttons and table headers on initial load', async () => {
    const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

    await waitFor(() => {
      expect(mockGetAllInventory).toHaveBeenCalled();
    }, { timeout: 1000 });

    // Verify toolbar and function buttons
    await waitFor(() => {
      const toolbar = container.querySelector('.ant-pro-table-list-toolbar');
      expect(toolbar).toBeTruthy();
    }, { timeout: 1000 });

    const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
    expect(toolbar).toBeTruthy();

    const expectedButtons = ['新規登録', 'ダウンロード', 'アップロード', '複数更新', '複数登録', '複数削除'];

    if (toolbar) {
      await waitFor(() => {
        expectedButtons.forEach((label) => {
          const button = within(toolbar).getByRole('button', { name: label });
          expect(button).toBeTruthy();
        });
      }, { timeout: 1000 });
    }

    // Verify table and headers
    await waitFor(() => {
      const tableWrapper = container.querySelector('.ant-table-wrapper');
      expect(tableWrapper).toBeTruthy();
    }, { timeout: 1000 });

    const tableWrapper = container.querySelector('.ant-table-wrapper') as HTMLElement | null;
    expect(tableWrapper).toBeTruthy();

    const expectedHeaders = [
      '会社コード',
      '従来工場コード',
      '商品工場コード',
      '運用開始日',
      '運用終了日',
      '従来工場名',
      '商品工場名',
      'マテリアル部署コード',
      '環境情報',
      '認証フラグ',
      '企業コード',
      '連携パターン',
      'HULFTID',
    ];

    if (tableWrapper) {
      await waitFor(() => {
        // Get all header cells in the table header row
        const headerCells = within(tableWrapper).getAllByRole('columnheader');
        
        // Extract the text content of each header cell
        const headerTexts = headerCells.map(cell => cell.textContent?.trim());
        
        // Check that all expected headers exist in the table
        expectedHeaders.forEach((headerText) => {
          expect(headerTexts).toContain(headerText);
        });
      }, { timeout: 1000 });
    }
  });

  /**
 * Test ID: T0003
 * Test Name: Check Page Initial Data Load
 * Initial Stimulus: At the component initial load
 * Expected Response: it should call the Mock API and show in the table the mocked records
 * Response Details (Assertions):
 *   - The record's information should be visible in the table
 *   - The pagination should be visible and accurate with the mocked records' number
 */
it('T0003: Check Page Initial Data Load - should display mocked records and correct pagination', async () => {
  // Mock data
  const mockData = [
    {
      id: '1',
      companyCode: 'COMP001',
      previousFactoryCode: 'FACT001',
      productFactoryCode: 'PROD001',
      startOperationDate: '2023-01-01',
      endOperationDate: '2023-12-31',
      previousFactoryName: 'Factory 1',
      productFactoryName: 'Product Factory 1',
      materialDepartmentCode: 'DEPT001',
      environmentalInformation: 'Info 1',
      authenticationFlag: 'Y',
      groupCorporateCode: 'CORP001',
      integrationPattern: 'Pattern 1',
      hulftid: 'HULFT001',
    },
    {
      id: '2',
      companyCode: 'COMP002',
      previousFactoryCode: 'FACT002',
      productFactoryCode: 'PROD002',
      startOperationDate: '2023-02-01',
      endOperationDate: '2023-11-30',
      previousFactoryName: 'Factory 2',
      productFactoryName: 'Product Factory 2',
      materialDepartmentCode: 'DEPT002',
      environmentalInformation: 'Info 2',
      authenticationFlag: 'N',
      groupCorporateCode: 'CORP002',
      integrationPattern: 'Pattern 2',
      hulftid: 'HULFT002',
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

    // Get all table cells
    const cells = within(tableWrapper!).getAllByRole('cell');
    
    // Extract text from all cells
    const cellTexts = cells.map(cell => cell.textContent?.trim());
    
    // Check that our expected data is present in the table
    mockData.forEach(record => {
      expect(cellTexts).toContain(record.companyCode);
      expect(cellTexts).toContain(record.previousFactoryCode);
      expect(cellTexts).toContain(record.previousFactoryName);
    });

    // Verify pagination shows correct total
    const pagination = container.querySelector('.ant-pagination-total-text');
    // console.log(pagination?.textContent);
    expect(pagination?.textContent).toBe(`1ページ目 1～${mockData.length} /合計 ${mockData.length}`);
  }
});

/**
 * Test ID: T0004
 * Test Name: Check Search Functionality 検索
 * Initial Stimulus: After the component loads, When typing data in the search textboxes and pressing the button 検索
 * Expected Response: it should make a API call passing the data from the search textboxes, and show the API replied records in the table.
 * Response Details (Assertions):
 *   - The replied record's information should be visible in the table
 *   - The pagination should be visible and accurate with the replied records' number
 */
it('T0004: Check Search Functionality - should filter records based on search criteria', async () => {
  // Initial mock data
  const initialMockData = [
    {
      id: '1',
      companyCode: 'COMP001',
      previousFactoryCode: 'FACT001',
      productFactoryCode: 'PROD001',
      previousFactoryName: 'Factory 1',
      // ... other fields
    },
    {
      id: '2',
      companyCode: 'COMP002',
      previousFactoryCode: 'FACT002',
      productFactoryCode: 'PROD002',
      previousFactoryName: 'Factory 2',
      // ... other fields
    }
  ];

  // Filtered mock data (what we expect after search)
  const filteredMockData = [{
    id: '1',
    companyCode: 'COMP001',
    previousFactoryCode: 'FACT001',
    productFactoryCode: 'PROD001',
    previousFactoryName: 'Factory 1',
    // ... other fields
  }];

  // First mock response for initial load
  mockGetAllInventory.mockResolvedValue({
    data: initialMockData,
    success: true,
    total: initialMockData.length,
  });
  // console.log('initialMockData loaded');
  const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

  // Wait for initial load
  let tableWrapper: HTMLElement | null = null;
  await waitFor(() => {
    tableWrapper = container.querySelector('.ant-table-wrapper');
    expect(tableWrapper).toBeTruthy();
    // console.log('tableWrapper loaded');
  }, { timeout: 1000 });

  
  // console.log('filteredMockData loaded');
  if (tableWrapper) {
    // console.log('tableWrapper found');
    // Find search input and button
    const searchInputs = container.querySelectorAll('input[placeholder*="入力してください"]');
    const searchButton = screen.getByRole('button', { name: /検 索/ });
    // console.log('searchInputs found', searchInputs);
    // console.log('searchButton found', searchButton);
    // Type search criteria
    fireEvent.change(searchInputs[0], { target: { value: 'COMP001' } });
    // console.log('searchInputs changed');
    // Second mock response for search
    mockGetAllInventory.mockResolvedValue({
      data: filteredMockData,
      success: true,
      total: filteredMockData.length,
    });
    // Click search button
    fireEvent.click(searchButton);
    // console.log('searchButton clicked');

    // Verify API was called with search parameters
    await waitFor(() => {
      expect(mockGetAllInventory).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchKeyword: 'COMP001',
          // Add other expected search parameters here
        })
      );
      // console.log('API called with search parameters');
    }, { timeout: 1000 });

    // Wait for filtered results to load
    await waitFor(() => {
      const rows = within(tableWrapper!).queryAllByRole('row');
      // Should have header + 1 data row
      expect(rows.length).toBe(2);
      // console.log('filtered results loaded');
    }, { timeout: 1000 });

    // Verify filtered data is displayed
    const cells = within(tableWrapper!).getAllByRole('cell');
    const cellTexts = cells.map(cell => cell.textContent?.trim());
    
    expect(cellTexts).toContain('COMP001');
    expect(cellTexts).not.toContain('COMP002');
    
    // Verify pagination shows correct total for filtered results
    const filteredPagination = container.querySelector('.ant-pagination-total-text');
    expect(filteredPagination?.textContent).toBe(`1ページ目 1～1 /合計 1`);
  }
});

/**
 * Test ID: T0005
 * Test Name: Check Search Functionality クリア
 * Initial Stimulus: After the component loads, When typing data in the search textboxes and pressing the button クリア
 * Expected Response: it should ignore the textboxes and make a API call without searching params, and show the API replied records in the table.
 * Response Details (Assertions):
 *   - The replied record's information should be visible in the table
 *   - The pagination should be visible and accurate with the replied records' number
 *   - The search textboxes should be cleared
 */
  it('T0005: Check Search Functionality クリア - should clear search and show all records', async () => {
    // Initial mock data
    const initialMockData = [
      {
        id: '1',
        companyCode: 'COMP001',
        previousFactoryCode: 'FACT001',
        productFactoryCode: 'PROD001',
        previousFactoryName: 'Factory 1',
      },
      {
        id: '2',
        companyCode: 'COMP002',
        previousFactoryCode: 'FACT002',
        productFactoryCode: 'PROD002',
        previousFactoryName: 'Factory 2',
      }
    ];

    // First mock response for initial load
    mockGetAllInventory.mockResolvedValue({
      data: initialMockData,
      success: true,
      total: initialMockData.length,
    });

    const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

    // Wait for initial load
    let tableWrapper: HTMLElement | null = null;
    await waitFor(() => {
      tableWrapper = container.querySelector('.ant-table-wrapper');
      expect(tableWrapper).toBeTruthy();
    }, { timeout: 1000 });

    if (tableWrapper) {

      const searchWrapper = container.querySelector('.ant-pro-table-search') as HTMLElement | null;
      expect(searchWrapper).toBeTruthy();

      // Find search input and buttons
      // const searchInputs = container.querySelectorAll('input[placeholder*="入力してください"]');
      const searchInputs = within(searchWrapper!).getAllByPlaceholderText('入力してください', {exact: false});
      console.log('Search Inputs found: ' + searchInputs.length );
      // const clearButton = screen.getByRole('button', { name: /ク リア/ });
      const clearButton = within(searchWrapper!).getByRole('button', { name: /クリア/, hidden: true });
      // const clearButton = container.querySelector('button[value="クリア"]');
      console.log('Clear Button found');
      // Type search criteria
      fireEvent.change(searchInputs[0], { target: { value: 'COMP001' } });
      console.log('Data input pushed');
      
      // Mock response after clear (should return all data)
      mockGetAllInventory.mockResolvedValue({
        data: initialMockData,
        success: true,
        total: initialMockData.length,
      });

      // Click clear button
      fireEvent.click(clearButton);
      console.log('Clear button clicked');

      // Verify API was called without search parameters
      await waitFor(() => {
        expect(mockGetAllInventory).toHaveBeenLastCalledWith(
          expect.not.objectContaining({ searchKeyword: expect.anything() })
        );
      }, { timeout: 1000 });

      // Verify search input is cleared
      await waitFor(() => {
        // Verify search input is cleared by checking the DOM directly
        const searchInputs = within(searchWrapper!).getAllByPlaceholderText('入力してください', {exact: false});
        const searchInput = searchInputs[0] as HTMLInputElement;
        expect(searchInput.value).toBe('');
      }, { timeout: 1000 });
      
      // Verify all records are shown
      await waitFor(() => {
        const rows = within(tableWrapper!).queryAllByRole('row');
        // Should have header + all data rows
        expect(rows.length).toBe(initialMockData.length + 1);
      }, { timeout: 1000 });

      // Verify pagination shows correct total
      const pagination = container.querySelector('.ant-pagination-total-text');
      expect(pagination?.textContent).toContain(`1ページ目 1～${initialMockData.length} /合計 ${initialMockData.length}`);
    }
  });


  /**
 * Test ID: T0006
 * Test Name: Check 新規登録 form fields exist
 * Initial Stimulus: After the component loads, when pressing the button 新規登録
 * Expected Response: it should be visible a form with all the record fields
 * Response Details (Assertions):
 *   - Title: 新規登録
 *   - Textbox labels: 会社コード, 従来工場コード, 商品工場コード, 運用開始日, 運用終了日, 従来工場名, 商品工場名, マテリアル部署コード, 環境情報, 認証フラグ, 企業コード, 連携パターン, HULFTID
 */
it('T0006: Check 新規登録 form fields exist - should display form with all fields when clicking 新規登録', async () => {
  // Mock initial data
  const initialMockData = [
    {
      id: '1',
      companyCode: 'COMP001',
      previousFactoryCode: 'FACT001',
      productFactoryCode: 'PROD001',
      previousFactoryName: 'Factory 1',
    }
  ];

  // Mock API response
  mockGetAllInventory.mockResolvedValue({
    data: initialMockData,
    success: true,
    total: initialMockData.length,
  });

  const { container } = renderWithIntl(React.createElement(SearchListV2), 'ja-JP');

  // Wait for initial load
  await waitFor(() => {
    const tableWrapper = container.querySelector('.ant-table-wrapper');
    expect(tableWrapper).toBeTruthy();
  }, { timeout: 1000 });

  // Find and click the 新規登録 button
  const toolbar = container.querySelector('.ant-pro-table-list-toolbar') as HTMLElement | null;
  expect(toolbar).toBeTruthy();

  if (toolbar) {
    const newButton = within(toolbar).getByRole('button', { name: /新規登録/ });
    fireEvent.click(newButton);

    // Wait for the modal to appear
    await waitFor(() => {
      const modal = document.querySelector('.ant-modal');
      expect(modal).toBeTruthy();
    }, { timeout: 1000 });

    // Get the modal content
    const modal = document.querySelector('.ant-modal') as HTMLElement;
    const modalContent = within(modal);

    // Check the title
    const title = modalContent.getByText('新規登録');
    expect(title).toBeTruthy();

    // Check all the form field labels
    const expectedLabels = [
      '会社コード',
      '従来工場コード',
      '商品工場コード',
      '運用開始日',
      '運用終了日',
      '従来工場名',
      '商品工場名',
      'マテリアル部署コード',
      '環境情報',
      '認証フラグ',
      '企業コード',
      '連携パターン',
      'HULFTID'
    ];

    expectedLabels.forEach(label => {
      const labelElement = modalContent.getByText(label);
      expect(labelElement).toBeTruthy();
    });

    // Close the modal to clean up
    const closeButton = modalContent.getByRole('button', { name: /キャンセル/ });
    fireEvent.click(closeButton);
  }
});

})

import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { ConfigProvider } from 'antd';
import jaJP from 'antd/es/locale/ja_JP';
import enUS from 'antd/es/locale/en_US';
import UserMaster from './index';
import * as apiModule from '@/services/ant-design-pro/api';
import enUSMessages from '@/locales/en-US';
import jaJPMessages from '@/locales/ja-JP';

// Mock the API service
jest.mock('@/services/ant-design-pro/api', () => ({
  getAllUsers: jest.fn(),
  insertUserRecordArray: jest.fn(),
  updateUserRecordBatch: jest.fn(),
  deleteUserRecordArray: jest.fn(),
  addUserRecord: jest.fn(),
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

describe('UserMaster Component', () => {
  const mockGetAllUsers = apiModule.getAllUsers as jest.Mock;
  const mockAddUserRecord = apiModule.addUserRecord as jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Default mock implementation
    mockGetAllUsers.mockResolvedValue({
      data: [],
      success: true,
    });

    // Default mock for addUserRecord
    mockAddUserRecord.mockResolvedValue({
      data: {},
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
    const antdLocale = locale === 'ja-JP' ? jaJP : enUS;
    const messages = locale === 'ja-JP' ? jaJPMessages : enUSMessages;
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

  it('should render UserMaster component', async () => {
    const { container } = renderWithIntl(React.createElement(UserMaster));

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Verify that the component rendered (check for PageContainer or any unique element)
    expect(container).toBeTruthy();
  });

  it('should call getAllUsers on mount', async () => {
    renderWithIntl(React.createElement(UserMaster));

    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  it('should display 2 users in the ProTable list', async () => {
    const mockUsers: API.UserListItem[] = [
      {
        id: '1',
        name: 'John',
        lastname: 'Doe',
        age: 30,
        country: 'USA',
        homeAddress: '123 Main St',
      },
      {
        id: '2',
        name: 'Jane',
        lastname: 'Smith',
        age: 25,
        country: 'Canada',
        homeAddress: '456 Oak Ave',
      },
    ];

    // Mock to return all users initially, then filtered results
    mockGetAllUsers.mockImplementation((params?: any) => {
      if (params?.searchKeyword === 'John') {
        return Promise.resolve({
          data: [mockUsers[0]], // Only John
          success: true,
        });
      }
      return Promise.resolve({
        data: mockUsers, // All users
        success: true,
      });
    });

    const { container } = renderWithIntl(React.createElement(UserMaster), 'ja-JP');

    // Wait for the API call to complete and users to appear
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Wait for both users to appear in the table initially
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
      expect(screen.getByText('Jane')).toBeTruthy();
    }, { timeout: 3000 });

    // Verify both users' data is visible in the table
    expect(screen.getByText('Doe')).toBeTruthy();
    expect(screen.getByText('Smith')).toBeTruthy();

    // Find the search input field by id
    await waitFor(() => {
      const searchInput = container.querySelector('#searchKeyword') as HTMLInputElement;
      expect(searchInput).toBeTruthy();
    });

    const searchInput = container.querySelector('#searchKeyword') as HTMLInputElement;

    // Type "John" in the search field
    fireEvent.change(searchInput, { target: { value: 'John' } });
    expect(searchInput.value).toBe('John');

    // Find the search form and submit it
    const searchForm = searchInput.closest('form');
    expect(searchForm).toBeTruthy();

    // Submit the form to trigger search
    if (searchForm) {
      fireEvent.submit(searchForm);
    }

    // Wait for the filtered results (only John should be visible)
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
      expect(screen.queryByText('Jane')).toBeFalsy(); // Jane should not be visible
    }, { timeout: 3000 });

    // Verify only John's data is visible
    expect(screen.getByText('Doe')).toBeTruthy();
    expect(screen.queryByText('Smith')).toBeFalsy();

    // Clear the search - reset the input and submit the form
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(searchInput.value).toBe('');

    // Submit the form again to clear the search
    if (searchForm) {
      fireEvent.submit(searchForm);
    }

    // Wait for both users to appear again after clearing
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
      expect(screen.getByText('Jane')).toBeTruthy();
    }, { timeout: 3000 });

    // Verify both users' data is visible again
    expect(screen.getByText('Doe')).toBeTruthy();
    expect(screen.getByText('Smith')).toBeTruthy();
  });

  it('should display 2 users and open create modal when clicking 新規登録 button', async () => {
    const mockUsers: API.UserListItem[] = [
      {
        id: '1',
        name: 'John',
        lastname: 'Doe',
        age: 30,
        country: 'USA',
        homeAddress: '123 Main St',
      },
      {
        id: '2',
        name: 'Jane',
        lastname: 'Smith',
        age: 25,
        country: 'Canada',
        homeAddress: '456 Oak Ave',
      },
    ];

    // Mock to return all users
    mockGetAllUsers.mockResolvedValue({
      data: mockUsers,
      success: true,
    });

    const { container } = renderWithIntl(React.createElement(UserMaster), 'ja-JP');

    // Wait for the API call to complete and users to appear
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Wait for both users to appear in the table
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
      expect(screen.getByText('Jane')).toBeTruthy();
    }, { timeout: 3000 });

    // Verify both users' data is visible in the table
    expect(screen.getByText('Doe')).toBeTruthy();
    expect(screen.getByText('Smith')).toBeTruthy();

    // Find the 新規登録 button
    await waitFor(() => {
      const allButtons = Array.from(container.querySelectorAll('button'));
      const createButton = allButtons.find(btn => {
        const text = (btn.textContent || '').trim();
        return text === '新規登録';
      });
      expect(createButton).toBeTruthy();
    }, { timeout: 3000 });

    const allButtons = Array.from(container.querySelectorAll('button'));
    const createButton = allButtons.find(btn => {
      const text = (btn.textContent || '').trim();
      return text === '新規登録';
    });

    expect(createButton).toBeTruthy();

    // Click the 新規登録 button
    if (createButton) {
      fireEvent.click(createButton);
    }

    // Wait for the modal to appear and verify it's showing
    // Modal might be rendered in a portal, so check document.body
    await waitFor(() => {
      // Check for the modal by looking for the modal container in the document
      const modal = document.querySelector('.ant-modal');
      expect(modal).toBeTruthy();
    }, { timeout: 3000 });

    // Verify the modal is visible by checking for modal-specific elements
    const modal = document.querySelector('.ant-modal');
    expect(modal).toBeTruthy();

    // Verify the modal title "新規登録" is visible in the modal
    // Use getAllByText since "新規登録" appears in both button and modal title
    const allElementsWithText = screen.getAllByText('新規登録');
    expect(allElementsWithText.length).toBeGreaterThan(0);

    // Verify the modal title specifically exists
    const modalTitle = document.querySelector('.ant-modal-title');
    expect(modalTitle).toBeTruthy();
    expect(modalTitle?.textContent).toBe('新規登録');

    // Fill in the form fields with new user data
    const newUser = {
      name: 'Bob',
      lastname: 'Johnson',
      age: 35,
      country: 'UK',
      homeAddress: '789 London St',
    };

    // Wait for form fields to be available in the modal
    await waitFor(() => {
      const modal = document.querySelector('.ant-modal');
      expect(modal).toBeTruthy();
    }, { timeout: 3000 });

    // Find and fill the name field (名前) by label
    await waitFor(() => {
      const nameInput = screen.getByLabelText('名前') as HTMLInputElement;
      expect(nameInput).toBeTruthy();
    }, { timeout: 3000 });

    const nameInput = screen.getByLabelText('名前') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: newUser.name } });
    fireEvent.blur(nameInput);

    // Find and fill the lastname field (氏名) by label
    await waitFor(() => {
      const lastnameInput = screen.getByLabelText('氏名') as HTMLInputElement;
      expect(lastnameInput).toBeTruthy();
    }, { timeout: 3000 });

    const lastnameInput = screen.getByLabelText('氏名') as HTMLInputElement;
    fireEvent.change(lastnameInput, { target: { value: newUser.lastname } });
    fireEvent.blur(lastnameInput);

    // Find and fill the age field (年齢) by label
    await waitFor(() => {
      const ageInput = screen.getByLabelText('年齢') as HTMLInputElement;
      expect(ageInput).toBeTruthy();
    }, { timeout: 3000 });

    const ageInput = screen.getByLabelText('年齢') as HTMLInputElement;
    fireEvent.change(ageInput, { target: { value: newUser.age.toString() } });
    fireEvent.blur(ageInput);

    // Find and fill the country field (国籍) by label
    const countryInput = screen.getByLabelText('国籍') as HTMLInputElement;
    fireEvent.change(countryInput, { target: { value: newUser.country } });
    fireEvent.blur(countryInput);

    // Find and fill the homeAddress field (住所) by label
    const homeAddressInput = screen.getByLabelText('住所') as HTMLTextAreaElement;
    fireEvent.change(homeAddressInput, { target: { value: newUser.homeAddress } });
    fireEvent.blur(homeAddressInput);

    // Mock addUserRecord to return success
    mockAddUserRecord.mockResolvedValue({
      data: { id: '3', ...newUser },
      success: true,
    });

    // Update getAllUsers to return all 3 users after the reload
    const allUsers = [
      ...mockUsers,
      {
        id: '3',
        ...newUser,
      },
    ];
    mockGetAllUsers.mockResolvedValue({
      data: allUsers,
      success: true,
    });

    // Find and click the 登録 (Register) button by role and name
    // Wait for the button to be available
    const submitButton = await waitFor(() => {
      return screen.getByRole('button', { name: '登 録' });
    }, { timeout: 5000 });

    fireEvent.click(submitButton);

    // Wait for addUserRecord to be called
    await waitFor(() => {
      expect(mockAddUserRecord).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Wait for the modal to close (it closes after successful submission)
    // await waitFor(() => {
    //   const modal = document.querySelector('.ant-modal');
    //   expect(modal).toBeFalsy();
    // }, { timeout: 5000 });

    // Wait for getAllUsers to be called again (reload after 1 second)
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });

    // Wait for all 3 users to appear in the table
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
      expect(screen.getByText('Jane')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
    }, { timeout: 5000 });

    // Verify all users' data is visible in the table
    expect(screen.getByText('Doe')).toBeTruthy();
    expect(screen.getByText('Smith')).toBeTruthy();
    expect(screen.getByText('Johnson')).toBeTruthy();
  });
});


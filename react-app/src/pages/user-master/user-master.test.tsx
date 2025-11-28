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
  updateUserRecord: jest.fn(),
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
  const mockUpdateUserRecord = apiModule.updateUserRecord as jest.Mock;
  const mockUpdateUserRecordBatch = apiModule.updateUserRecordBatch as jest.Mock;
  const mockInsertUserRecordArray = apiModule.insertUserRecordArray as jest.Mock;

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

    // Default mock for updateUserRecord
    mockUpdateUserRecord.mockResolvedValue({
      data: {},
      success: true,
    });

    // Default mock for updateUserRecordBatch
    mockUpdateUserRecordBatch.mockResolvedValue({
      data: [],
      success: true,
    });

    // Default mock for insertUserRecordArray
    mockInsertUserRecordArray.mockResolvedValue({
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
    }, { timeout: 1000 });

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
    }, { timeout: 1000 });

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
    }, { timeout: 1000 });

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
    }, { timeout: 333 });

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
    }, { timeout: 333 });

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
    }, { timeout: 333 });

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
    }, { timeout: 333 });

    // Find and fill the name field (名前) by label
    await waitFor(() => {
      const nameInput = screen.getByLabelText('名前') as HTMLInputElement;
      expect(nameInput).toBeTruthy();
    }, { timeout: 1000 });

    const nameInput = screen.getByLabelText('名前') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: newUser.name } });
    fireEvent.blur(nameInput);

    // Find and fill the lastname field (氏名) by label
    await waitFor(() => {
      const lastnameInput = screen.getByLabelText('氏名') as HTMLInputElement;
      expect(lastnameInput).toBeTruthy();
    }, { timeout: 1000 });

    const lastnameInput = screen.getByLabelText('氏名') as HTMLInputElement;
    fireEvent.change(lastnameInput, { target: { value: newUser.lastname } });
    fireEvent.blur(lastnameInput);

    // Find and fill the age field (年齢) by label
    await waitFor(() => {
      const ageInput = screen.getByLabelText('年齢') as HTMLInputElement;
      expect(ageInput).toBeTruthy();
    }, { timeout: 1000 });

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
    }, { timeout: 1667 });

    fireEvent.click(submitButton);

    // Wait for addUserRecord to be called
    await waitFor(() => {
      expect(mockAddUserRecord).toHaveBeenCalled();
    }, { timeout: 1000 });


    // Wait for getAllUsers to be called again (reload after 1 second)
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalledTimes(2);
    }, { timeout: 1667 });

    // Wait for all 3 users to appear in the table
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
      expect(screen.getByText('Jane')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
    }, { timeout: 1667 });

    // Verify all users' data is visible in the table
    expect(screen.getByText('Doe')).toBeTruthy();
    expect(screen.getByText('Smith')).toBeTruthy();
    expect(screen.getByText('Johnson')).toBeTruthy();
  });

  it('should edit user information and verify it updates in the table', async () => {
    // Step 1: Load 1 user in the table
    const mockUser: API.UserListItem = {
      id: '1',
      name: 'John',
      lastname: 'Doe',
      age: 30,
      country: 'USA',
      homeAddress: '123 Main St',
    };

    mockGetAllUsers.mockResolvedValue({
      data: [mockUser],
      success: true,
    });

    const { container } = renderWithIntl(React.createElement(UserMaster), 'ja-JP');

    // Wait for the API call to complete and user to appear
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Wait for the user to appear in the table
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
      expect(screen.getByText('Doe')).toBeTruthy();
    }, { timeout: 1000 });

    // Step 2: Press the editing button that has the "ant-btn-icon" css class
    await waitFor(() => {
      const editButton = container.querySelector('.ant-btn-icon') as HTMLButtonElement;
      expect(editButton).toBeTruthy();
    }, { timeout: 1000 });

    const editButton = container.querySelector('.ant-btn-icon') as HTMLButtonElement;
    expect(editButton).toBeTruthy();

    // Click the edit button
    fireEvent.click(editButton);

    // Wait for the modal to appear
    await waitFor(() => {
      const modal = document.querySelector('.ant-modal');
      expect(modal).toBeTruthy();
    }, { timeout: 1000 });

    // Step 3: Change the information in the fields: 名前, 氏名, 年齢, 国籍, 住所
    const updatedUser = {
      name: 'Jane',
      lastname: 'Smith',
      age: 25,
      country: 'Canada',
      homeAddress: '456 Oak Ave',
    };

    // Wait for form fields to be available in the modal
    await waitFor(() => {
      const nameInput = screen.getByLabelText('名前') as HTMLInputElement;
      expect(nameInput).toBeTruthy();
    }, { timeout: 1000 });

    // Change 名前 (name)
    const nameInput = screen.getByLabelText('名前') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: updatedUser.name } });
    fireEvent.blur(nameInput);

    // Change 氏名 (lastname)
    const lastnameInput = screen.getByLabelText('氏名') as HTMLInputElement;
    fireEvent.change(lastnameInput, { target: { value: updatedUser.lastname } });
    fireEvent.blur(lastnameInput);

    // Change 年齢 (age)
    const ageInput = screen.getByLabelText('年齢') as HTMLInputElement;
    fireEvent.change(ageInput, { target: { value: updatedUser.age.toString() } });
    fireEvent.blur(ageInput);

    // Change 国籍 (country)
    const countryInput = screen.getByLabelText('国籍') as HTMLInputElement;
    fireEvent.change(countryInput, { target: { value: updatedUser.country } });
    fireEvent.blur(countryInput);

    // Change 住所 (homeAddress)
    const homeAddressInput = screen.getByLabelText('住所') as HTMLTextAreaElement;
    fireEvent.change(homeAddressInput, { target: { value: updatedUser.homeAddress } });
    fireEvent.blur(homeAddressInput);

    // Mock updateUserRecord to return success
    mockUpdateUserRecord.mockResolvedValue({
      data: { id: '1', ...updatedUser },
      success: true,
    });

    // Update getAllUsers to return the updated user after reload
    mockGetAllUsers.mockResolvedValue({
      data: [{ id: '1', ...updatedUser }],
      success: true,
    });

    // Step 4: Press the "更 新" button
    const updateButton = await waitFor(() => {
      return screen.getByRole('button', { name: '更 新' });
    }, { timeout: 1667 });

    fireEvent.click(updateButton);

    // Wait for updateUserRecord to be called
    await waitFor(() => {
      expect(mockUpdateUserRecord).toHaveBeenCalled();
    }, { timeout: 1000 });

    // Wait for getAllUsers to be called again (reload after 1 second)
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalledTimes(2);
    }, { timeout: 1667 });

    // Step 5: Check that the information in the table matches with the new information of the user
    await waitFor(() => {
      const tableCells = container.querySelectorAll('td');
      const cellTexts = Array.from(tableCells).map(td => td.textContent || '');
      expect(cellTexts.some(text => text.includes(updatedUser.name))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(updatedUser.lastname))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(updatedUser.country))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(updatedUser.homeAddress))).toBeTruthy();
    }, { timeout: 1667 });

    // Verify the updated user's data is visible in the table cells
    const tableCells = container.querySelectorAll('td');
    const cellTexts = Array.from(tableCells).map(td => td.textContent || '');
    expect(cellTexts.some(text => text.includes(updatedUser.name))).toBeTruthy();
    expect(cellTexts.some(text => text.includes(updatedUser.lastname))).toBeTruthy();
    expect(cellTexts.some(text => text.includes(updatedUser.country))).toBeTruthy();
    expect(cellTexts.some(text => text.includes(updatedUser.homeAddress))).toBeTruthy();

    // Verify old data is no longer visible in table cells
    expect(cellTexts.some(text => text.includes('John'))).toBeFalsy();
    expect(cellTexts.some(text => text.includes('Doe'))).toBeFalsy();
    expect(cellTexts.some(text => text.includes('USA'))).toBeFalsy();
    expect(cellTexts.some(text => text.includes('123 Main St'))).toBeFalsy();
  });

  it('should update multiple users using batch update and verify success message', async () => {
    // Step 1: Load 3 users in the table
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
      {
        id: '3',
        name: 'Bob',
        lastname: 'Johnson',
        age: 35,
        country: 'UK',
        homeAddress: '789 London St',
      },
    ];

    mockGetAllUsers.mockResolvedValue({
      data: mockUsers,
      success: true,
    });

    const { container } = renderWithIntl(React.createElement(UserMaster), 'ja-JP');

    // Wait for the API call to complete and users to appear
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Wait for all 3 users to appear in the table
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
      expect(screen.getByText('Jane')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
    }, { timeout: 1000 });

    // Step 2: Press the "複数更新" button
    await waitFor(() => {
      const allButtons = Array.from(container.querySelectorAll('button'));
      const batchUpdateButton = allButtons.find(btn => {
        const text = (btn.textContent || '').trim();
        return text === '複数更新';
      });
      expect(batchUpdateButton).toBeTruthy();
    }, { timeout: 1000 });

    const allButtons = Array.from(container.querySelectorAll('button'));
    const batchUpdateButton = allButtons.find(btn => {
      const text = (btn.textContent || '').trim();
      return text === '複数更新';
    });

    expect(batchUpdateButton).toBeTruthy();

    if (batchUpdateButton) {
      fireEvent.click(batchUpdateButton);
    }

    // Wait for the table to enter edit mode
    await waitFor(() => {
      const saveButton = Array.from(container.querySelectorAll('button')).find(btn => {
        const text = (btn.textContent || '').trim();
        return text === '保存';
      });
      expect(saveButton).toBeTruthy();
    }, { timeout: 1000 });

    // Step 3: Update the information of the 3 records in the <td> elements
    const updatedUsers: API.UserListItem[] = [
      {
        id: '1',
        name: 'JohnUpdated',
        lastname: 'DoeUpdated',
        age: 31,
        country: 'USAUpdated',
        homeAddress: '123 Main St Updated',
      },
      {
        id: '2',
        name: 'JaneUpdated',
        lastname: 'SmithUpdated',
        age: 26,
        country: 'CanadaUpdated',
        homeAddress: '456 Oak Ave Updated',
      },
      {
        id: '3',
        name: 'BobUpdated',
        lastname: 'JohnsonUpdated',
        age: 36,
        country: 'UKUpdated',
        homeAddress: '789 London St Updated',
      },
    ];

    // Find all input fields in the table cells and update them
    await waitFor(() => {
      const inputs = container.querySelectorAll('td input');
      expect(inputs.length).toBeGreaterThan(0);
    }, { timeout: 1000 });

    // Get all input fields in table cells
    const nameInputs = Array.from(container.querySelectorAll('td input[type="text"]')).filter((input, index) => {
      // Filter to get name inputs (first text input in each row)
      const td = (input as HTMLElement).closest('td');
      return td !== null;
    });

    // Update name fields (assuming they are the first text inputs in each row)
    // We need to find inputs by their position in the table structure
    const allInputs = Array.from(container.querySelectorAll('td input'));

    // For each user, update the fields
    // The structure might vary, so we'll update inputs by finding them in order
    for (let i = 0; i < updatedUsers.length; i++) {
      const user = updatedUsers[i];

      // Find inputs in the row - we'll need to identify which row corresponds to which user
      // This is a simplified approach - in a real scenario, you might need to find by row index
      const rows = container.querySelectorAll('tbody tr');
      if (rows[i]) {
        const rowInputs = rows[i].querySelectorAll('input');

        // Update name (first text input)
        if (rowInputs[0] && rowInputs[0].getAttribute('type') === 'text') {
          fireEvent.change(rowInputs[0], { target: { value: user.name } });
          fireEvent.blur(rowInputs[0]);
        }

        // Update lastname (second text input)
        if (rowInputs[1] && rowInputs[1].getAttribute('type') === 'text') {
          fireEvent.change(rowInputs[1], { target: { value: user.lastname } });
          fireEvent.blur(rowInputs[1]);
        }

        // Update age (number input)
        const ageInput = rows[i].querySelector('input[type="number"]') as HTMLInputElement;
        if (ageInput && user.age !== undefined) {
          fireEvent.change(ageInput, { target: { value: user.age.toString() } });
          fireEvent.blur(ageInput);
        }

        // Update country (text input)
        const countryInput = Array.from(rows[i].querySelectorAll('input[type="text"]'))[2] as HTMLInputElement;
        if (countryInput) {
          fireEvent.change(countryInput, { target: { value: user.country } });
          fireEvent.blur(countryInput);
        }

        // Update homeAddress (textarea)
        const addressTextarea = rows[i].querySelector('textarea') as HTMLTextAreaElement;
        if (addressTextarea) {
          fireEvent.change(addressTextarea, { target: { value: user.homeAddress } });
          fireEvent.blur(addressTextarea);
        }
      }
    }

    // Mock updateUserRecordBatch to return success
    mockUpdateUserRecordBatch.mockResolvedValue({
      data: updatedUsers,
      success: true,
    });

    // Update getAllUsers to return the updated users after reload
    mockGetAllUsers.mockResolvedValue({
      data: updatedUsers,
      success: true,
    });

    // Step 4: Press the "保存" button to save the information
    const saveButton = await waitFor(() => {
      const buttons = Array.from(container.querySelectorAll('button'));
      return buttons.find(btn => {
        const text = (btn.textContent || '').trim();
        return text === '保存';
      });
    }, { timeout: 1000 });

    expect(saveButton).toBeTruthy();

    if (saveButton) {
      fireEvent.click(saveButton);
    }

    // Wait for updateUserRecordBatch to be called
    await waitFor(() => {
      expect(mockUpdateUserRecordBatch).toHaveBeenCalled();
    }, { timeout: 1000 });

    // Step 5: Check that the pop up that includes the text "更新できました" is visible
    await waitFor(() => {
      const message = screen.getByText('更新できました。');
      expect(message).toBeTruthy();
    }, { timeout: 1667 });

    // Verify the message is visible
    expect(screen.getByText('更新できました。')).toBeTruthy();

    // Wait for getAllUsers to be called again (reload after update)
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    }, { timeout: 1667 });

    // Step 6: Check that the information inside the <td> match with the updated user's information
    await waitFor(() => {
      const tableCells = container.querySelectorAll('td');
      const cellTexts = Array.from(tableCells).map(td => td.textContent || '');

      // Verify all updated users' data is visible in table cells
      updatedUsers.forEach(user => {
        expect(cellTexts.some(text => text.includes(user.name || ''))).toBeTruthy();
        expect(cellTexts.some(text => text.includes(user.lastname || ''))).toBeTruthy();
        expect(cellTexts.some(text => text.includes(user.country || ''))).toBeTruthy();
        expect(cellTexts.some(text => text.includes(user.homeAddress || ''))).toBeTruthy();
      });
    }, { timeout: 1667 });

    // Final verification of updated data in table cells
    const tableCells = container.querySelectorAll('td');
    const cellTexts = Array.from(tableCells).map(td => td.textContent || '');

    updatedUsers.forEach(user => {
      expect(cellTexts.some(text => text.includes(user.name || ''))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(user.lastname || ''))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(user.country || ''))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(user.homeAddress || ''))).toBeTruthy();
    });
  });

  it('should insert multiple new users using batch insert and verify all users in table', async () => {
    // Step 1: Load 1 user in the table
    const mockUser: API.UserListItem = {
      id: '1',
      name: 'John',
      lastname: 'Doe',
      age: 30,
      country: 'USA',
      homeAddress: '123 Main St',
    };

    mockGetAllUsers.mockResolvedValue({
      data: [mockUser],
      success: true,
    });

    const { container } = renderWithIntl(React.createElement(UserMaster), 'ja-JP');

    // Wait for the API call to complete and user to appear
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    });

    // Wait for the user to appear in the table
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
      expect(screen.getByText('Doe')).toBeTruthy();
    }, { timeout: 1000 });

    // Step 2: Press the "複数登録" button
    await waitFor(() => {
      const allButtons = Array.from(container.querySelectorAll('button'));
      const batchInsertButton = allButtons.find(btn => {
        const text = (btn.textContent || '').trim();
        return text === '複数登録';
      });
      expect(batchInsertButton).toBeTruthy();
    }, { timeout: 1000 });

    const allButtons = Array.from(container.querySelectorAll('button'));
    const batchInsertButton = allButtons.find(btn => {
      const text = (btn.textContent || '').trim();
      return text === '複数登録';
    });

    expect(batchInsertButton).toBeTruthy();

    if (batchInsertButton) {
      fireEvent.click(batchInsertButton);
    }

    // Wait for the table to enter insert mode
    await waitFor(() => {
      const addRecordButton = Array.from(container.querySelectorAll('button')).find(btn => {
        const text = (btn.textContent || '').trim();
        return text === '新規登録';
      });
      expect(addRecordButton).toBeTruthy();
    }, { timeout: 1000 });

    // Step 3: Press the "新規登録" button 3 times to generate 3 editable rows
    const addRecordButton = Array.from(container.querySelectorAll('button')).find(btn => {
      const text = (btn.textContent || '').trim();
      return text === '新規登録';
    });

    expect(addRecordButton).toBeTruthy();

    if (addRecordButton) {
      // Click 3 times to add 3 new rows
      fireEvent.click(addRecordButton);
      fireEvent.click(addRecordButton);
      fireEvent.click(addRecordButton);
    }

    // Wait for the new rows to appear
    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThanOrEqual(4); // 1 original + 3 new
    }, { timeout: 1000 });

    // Step 4: Input the information for the new 3 users in the <td> editable elements
    const newUsers: API.UserListItem[] = [
      {
        id: '2',
        name: 'Jane',
        lastname: 'Smith',
        age: 25,
        country: 'Canada',
        homeAddress: '456 Oak Ave',
      },
      {
        id: '3',
        name: 'Bob',
        lastname: 'Johnson',
        age: 35,
        country: 'UK',
        homeAddress: '789 London St',
      },
      {
        id: '4',
        name: 'Alice',
        lastname: 'Williams',
        age: 28,
        country: 'Australia',
        homeAddress: '321 Sydney Rd',
      },
    ];

    // Find all rows (the new rows should be at the top)
    const rows = container.querySelectorAll('tbody tr');

    // Update the first 3 rows (which should be the new editable rows)
    for (let i = 0; i < 3 && i < newUsers.length; i++) {
      const user = newUsers[i];
      const row = rows[i];

      if (row) {
        const rowInputs = row.querySelectorAll('input');
        const textareas = row.querySelectorAll('textarea');

        // Update name (first text input)
        if (rowInputs[0] && rowInputs[0].getAttribute('type') === 'text') {
          fireEvent.change(rowInputs[0], { target: { value: user.name } });
          fireEvent.blur(rowInputs[0]);
        }

        // Update lastname (second text input)
        if (rowInputs[1] && rowInputs[1].getAttribute('type') === 'text') {
          fireEvent.change(rowInputs[1], { target: { value: user.lastname } });
          fireEvent.blur(rowInputs[1]);
        }

        // Update age (number input)
        const ageInput = row.querySelector('input[type="number"]') as HTMLInputElement;
        if (ageInput && user.age !== undefined) {
          fireEvent.change(ageInput, { target: { value: user.age.toString() } });
          fireEvent.blur(ageInput);
        }

        // Update country (third text input)
        const countryInput = Array.from(row.querySelectorAll('input[type="text"]'))[2] as HTMLInputElement;
        if (countryInput) {
          fireEvent.change(countryInput, { target: { value: user.country } });
          fireEvent.blur(countryInput);
        }

        // Update homeAddress (textarea)
        const addressTextarea = row.querySelector('textarea') as HTMLTextAreaElement;
        if (addressTextarea) {
          fireEvent.change(addressTextarea, { target: { value: user.homeAddress } });
          fireEvent.blur(addressTextarea);
        }
      }
    }

    // Mock insertUserRecordArray to return success
    mockInsertUserRecordArray.mockResolvedValue({
      data: newUsers,
      success: true,
    });

    // Update getAllUsers to return all 4 users after reload (1 old + 3 new)
    const allUsers = [mockUser, ...newUsers];
    mockGetAllUsers.mockResolvedValue({
      data: allUsers,
      success: true,
    });

    // Step 5: Press the "保存" button
    const saveButton = await waitFor(() => {
      const buttons = Array.from(container.querySelectorAll('button'));
      return buttons.find(btn => {
        const text = (btn.textContent || '').trim();
        return text === '保存';
      });
    }, { timeout: 1000 });

    expect(saveButton).toBeTruthy();

    if (saveButton) {
      fireEvent.click(saveButton);
    }

    // Wait for insertUserRecordArray to be called
    await waitFor(() => {
      expect(mockInsertUserRecordArray).toHaveBeenCalled();
    }, { timeout: 1000 });

    // Wait for getAllUsers to be called again (reload after insert)
    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalled();
    }, { timeout: 1667 });

    // Step 6: Check that the information in the <td> match with the information of the 4 users (1 old, 3 new)
    await waitFor(() => {
      const tableCells = container.querySelectorAll('td');
      const cellTexts = Array.from(tableCells).map(td => td.textContent || '');

      // Verify all 4 users' data is visible in table cells
      // Original user
      expect(cellTexts.some(text => text.includes(mockUser.name || ''))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(mockUser.lastname || ''))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(mockUser.country || ''))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(mockUser.homeAddress || ''))).toBeTruthy();

      // New users
      newUsers.forEach(user => {
        expect(cellTexts.some(text => text.includes(user.name || ''))).toBeTruthy();
        expect(cellTexts.some(text => text.includes(user.lastname || ''))).toBeTruthy();
        expect(cellTexts.some(text => text.includes(user.country || ''))).toBeTruthy();
        expect(cellTexts.some(text => text.includes(user.homeAddress || ''))).toBeTruthy();
      });
    }, { timeout: 1667 });

    // Final verification of all users' data in table cells
    const tableCells = container.querySelectorAll('td');
    const cellTexts = Array.from(tableCells).map(td => td.textContent || '');

    // Verify original user
    expect(cellTexts.some(text => text.includes(mockUser.name || ''))).toBeTruthy();
    expect(cellTexts.some(text => text.includes(mockUser.lastname || ''))).toBeTruthy();
    expect(cellTexts.some(text => text.includes(mockUser.country || ''))).toBeTruthy();
    expect(cellTexts.some(text => text.includes(mockUser.homeAddress || ''))).toBeTruthy();

    // Verify new users
    newUsers.forEach(user => {
      expect(cellTexts.some(text => text.includes(user.name || ''))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(user.lastname || ''))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(user.country || ''))).toBeTruthy();
      expect(cellTexts.some(text => text.includes(user.homeAddress || ''))).toBeTruthy();
    });
  });
});


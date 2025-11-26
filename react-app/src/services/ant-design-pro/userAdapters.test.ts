import {
  adaptBackendUserItemToFrontend,
  adaptUserItemToBackend,
  adaptUserResponse,
} from './userAdapters';

describe('userAdapters', () => {
  describe('adaptBackendUserItemToFrontend', () => {
    it('should convert backend user item to frontend format correctly', () => {
      const backendUserItem: API.BackendUserListItem = {
        id: '123',
        name: 'John',
        lastname: 'Doe',
        age: 30,
        country: 'USA',
        home_address: '123 Main St',
      };

      const frontendUserItem = adaptBackendUserItemToFrontend(backendUserItem);

      expect(frontendUserItem).toEqual({
        id: '123',
        name: 'John',
        lastname: 'Doe',
        age: 30,
        country: 'USA',
        homeAddress: '123 Main St',
      });
    });

    it('should handle undefined values correctly', () => {
      const backendUserItem: API.BackendUserListItem = {
        id: '456',
        name: 'Jane',
        lastname: 'Smith',
        age: 25,
        country: undefined,
        home_address: undefined,
      };

      const frontendUserItem = adaptBackendUserItemToFrontend(backendUserItem);

      expect(frontendUserItem).toEqual({
        id: '456',
        name: 'Jane',
        lastname: 'Smith',
        age: 25,
        country: undefined,
        homeAddress: undefined,
      });
    });
  });

  describe('adaptUserItemToBackend', () => {
    it('should convert frontend user item to backend format correctly', () => {
      const frontendUserItem: API.UserListItem = {
        id: '123',
        name: 'John',
        lastname: 'Doe',
        age: 30,
        country: 'USA',
        homeAddress: '123 Main St',
      };

      const backendUserItem = adaptUserItemToBackend(frontendUserItem);

      expect(backendUserItem).toEqual({
        id: '123',
        name: 'John',
        lastname: 'Doe',
        age: 30,
        country: 'USA',
        home_address: '123 Main St',
      });
    });

    it('should handle undefined values correctly', () => {
      const frontendUserItem: API.UserListItem = {
        id: '456',
        name: 'Jane',
        lastname: 'Smith',
        age: 25,
        country: undefined,
        homeAddress: undefined,
      };

      const backendUserItem = adaptUserItemToBackend(frontendUserItem);

      expect(backendUserItem).toEqual({
        id: '456',
        name: 'Jane',
        lastname: 'Smith',
        age: 25,
        country: undefined,
        home_address: undefined,
      });
    });
  });

  describe('adaptUserResponse', () => {
    it('should convert backend response to frontend format correctly', () => {
      const backendResponse: API.BackendUserResponse = {
        code: 200,
        message: 'Success',
        data: {
          items: [
            {
              id: '1',
              name: 'John',
              lastname: 'Doe',
              age: 30,
              country: 'USA',
              home_address: '123 Main St',
            },
            {
              id: '2',
              name: 'Jane',
              lastname: 'Smith',
              age: 25,
              country: 'Canada',
              home_address: '456 Oak Ave',
            },
          ],
          total: 2,
          skip: 0,
          limit: 10,
        },
        error: null,
      };

      const frontendResponse = adaptUserResponse(backendResponse);

      expect(frontendResponse).toEqual({
        data: [
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
        ],
        total: 2,
        success: true,
      });
    });

    it('should handle empty items array correctly', () => {
      const backendResponse: API.BackendUserResponse = {
        code: 200,
        message: 'Success',
        data: {
          items: [],
          total: 0,
          skip: 0,
          limit: 10,
        },
        error: null,
      };

      const frontendResponse = adaptUserResponse(backendResponse);

      expect(frontendResponse).toEqual({
        data: [],
        total: 0,
        success: true,
      });
    });

    it('should handle non-200 status code correctly', () => {
      const backendResponse: API.BackendUserResponse = {
        code: 400,
        message: 'Bad Request',
        data: {
          items: [],
          total: null,
          skip: 0,
          limit: 10,
        },
        error: 'Invalid parameters',
      };

      const frontendResponse = adaptUserResponse(backendResponse);

      expect(frontendResponse).toEqual({
        data: [],
        total: undefined,
        success: false,
      });
    });

    it('should handle undefined data correctly', () => {
      const backendResponse: API.BackendUserResponse = {
        code: 200,
        message: 'Success',
        data: {
          items: [],
          total: null,
          skip: 0,
          limit: 10,
        },
        error: null,
      };

      const frontendResponse = adaptUserResponse(backendResponse);

      expect(frontendResponse).toEqual({
        data: [],
        total: undefined,
        success: true,
      });
    });
  });
});


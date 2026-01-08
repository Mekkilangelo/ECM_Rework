import { renderHook, act } from '@testing-library/react';
import useGenericFormState from '../useGenericFormState';

describe('useGenericFormState', () => {
  describe('Basic functionality', () => {
    it('should initialize with default values', () => {
      const initialData = {
        name: '',
        email: '',
        age: 0
      };

      const { result } = renderHook(() =>
        useGenericFormState(initialData, { entityName: 'User' })
      );

      expect(result.current.formData).toEqual(initialData);
      expect(result.current.errors).toEqual({});
      expect(result.current.loading).toBe(false);
      expect(result.current.message).toBeNull();
    });

    it('should update formData when setFormData is called', () => {
      const initialData = { name: '', email: '' };
      const { result } = renderHook(() =>
        useGenericFormState(initialData, { entityName: 'User' })
      );

      act(() => {
        result.current.setFormData({ name: 'John', email: 'john@example.com' });
      });

      expect(result.current.formData).toEqual({
        name: 'John',
        email: 'john@example.com'
      });
    });

    it('should update errors when setErrors is called', () => {
      const { result } = renderHook(() =>
        useGenericFormState({}, { entityName: 'User' })
      );

      const testErrors = { name: 'Name is required', email: 'Invalid email' };

      act(() => {
        result.current.setErrors(testErrors);
      });

      expect(result.current.errors).toEqual(testErrors);
    });

    it('should update loading state', () => {
      const { result } = renderHook(() =>
        useGenericFormState({}, { entityName: 'User' })
      );

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it('should update message state', () => {
      const { result } = renderHook(() =>
        useGenericFormState({}, { entityName: 'User' })
      );

      const testMessage = { type: 'success', text: 'Saved successfully!' };

      act(() => {
        result.current.setMessage(testMessage);
      });

      expect(result.current.message).toEqual(testMessage);
    });
  });

  describe('Entity-specific features', () => {
    it('should create dynamic fetching state name based on entityName', () => {
      const { result } = renderHook(() =>
        useGenericFormState({}, { entityName: 'Client', withFetching: true })
      );

      expect(result.current).toHaveProperty('fetchingClient');
      expect(result.current).toHaveProperty('setFetchingClient');
      expect(result.current.fetchingClient).toBe(false);
    });

    it('should not include fetching state when withFetching is false', () => {
      const { result } = renderHook(() =>
        useGenericFormState({}, { entityName: 'User', withFetching: false })
      );

      expect(result.current).not.toHaveProperty('fetchingUser');
      expect(result.current).not.toHaveProperty('setFetchingUser');
    });

    it('should include parentId when withParentId is true', () => {
      const { result } = renderHook(() =>
        useGenericFormState({}, { entityName: 'Order', withParentId: true })
      );

      expect(result.current).toHaveProperty('parentId');
      expect(result.current).toHaveProperty('setParentId');
      expect(result.current.parentId).toBeNull();
    });

    it('should not include parentId when withParentId is false', () => {
      const { result } = renderHook(() =>
        useGenericFormState({}, { entityName: 'Client', withParentId: false })
      );

      expect(result.current).not.toHaveProperty('parentId');
      expect(result.current).not.toHaveProperty('setParentId');
    });

    it('should update parentId state', () => {
      const { result } = renderHook(() =>
        useGenericFormState({}, { entityName: 'Order', withParentId: true })
      );

      act(() => {
        result.current.setParentId(42);
      });

      expect(result.current.parentId).toBe(42);
    });
  });

  describe('Multiple entity configurations', () => {
    it('should work correctly for Client entity', () => {
      const clientData = {
        name: '',
        country: '',
        city: ''
      };

      const { result } = renderHook(() =>
        useGenericFormState(clientData, {
          entityName: 'Client',
          withFetching: true,
          withParentId: false
        })
      );

      expect(result.current.formData).toEqual(clientData);
      expect(result.current).toHaveProperty('fetchingClient');
      expect(result.current).not.toHaveProperty('parentId');
    });

    it('should work correctly for Order entity', () => {
      const orderData = {
        request_date: '',
        description: ''
      };

      const { result } = renderHook(() =>
        useGenericFormState(orderData, {
          entityName: 'Order',
          withFetching: true,
          withParentId: true
        })
      );

      expect(result.current.formData).toEqual(orderData);
      expect(result.current).toHaveProperty('fetchingOrder');
      expect(result.current).toHaveProperty('parentId');
    });

    it('should work correctly for Trial entity', () => {
      const trialData = {
        name: '',
        trialDate: '',
        status: ''
      };

      const { result } = renderHook(() =>
        useGenericFormState(trialData, {
          entityName: 'Trial',
          withFetching: false,
          withParentId: false
        })
      );

      expect(result.current.formData).toEqual(trialData);
      expect(result.current).not.toHaveProperty('fetchingTrial');
      expect(result.current).not.toHaveProperty('parentId');
    });
  });

  describe('Complex form data', () => {
    it('should handle nested objects in formData', () => {
      const complexData = {
        user: {
          name: 'John',
          contact: {
            email: 'john@example.com',
            phone: '123456'
          }
        },
        settings: {
          theme: 'dark'
        }
      };

      const { result } = renderHook(() =>
        useGenericFormState(complexData, { entityName: 'Profile' })
      );

      expect(result.current.formData).toEqual(complexData);

      act(() => {
        result.current.setFormData({
          ...complexData,
          user: {
            ...complexData.user,
            name: 'Jane'
          }
        });
      });

      expect(result.current.formData.user.name).toBe('Jane');
      expect(result.current.formData.user.contact.email).toBe('john@example.com');
    });

    it('should handle arrays in formData', () => {
      const dataWithArray = {
        items: ['item1', 'item2'],
        contacts: [
          { name: 'John', email: 'john@example.com' },
          { name: 'Jane', email: 'jane@example.com' }
        ]
      };

      const { result } = renderHook(() =>
        useGenericFormState(dataWithArray, { entityName: 'List' })
      );

      expect(result.current.formData.items).toHaveLength(2);
      expect(result.current.formData.contacts).toHaveLength(2);
    });
  });
});

import { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  const runWithLoading = async (promiseOrFn, options = {}) => {
    const { successMessage, errorMessage } = options;
    try {
      setGlobalLoading(true);
      const result = await (typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn);
      if (successMessage) {
        toast.success(successMessage);
      }
      return result;
    } catch (error) {
      const detailMessage = Array.isArray(error?.details) ? error.details.find((item) => item?.message)?.message : '';
      const message = detailMessage || errorMessage || error?.message || 'Something went wrong.';
      toast.error(message);
      throw error;
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        globalLoading,
        setGlobalLoading,
        runWithLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }
  return context;
}

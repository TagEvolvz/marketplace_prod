import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  cartDrawerOpen: boolean;
  searchOpen: boolean;
  notificationDrawerOpen: boolean;
  theme: 'dark' | 'light';
}

const initialState: UIState = {
  sidebarOpen: false,
  cartDrawerOpen: false,
  searchOpen: false,
  notificationDrawerOpen: false,
  theme: 'dark',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => { state.sidebarOpen = action.payload; },
    toggleCartDrawer: (state) => { state.cartDrawerOpen = !state.cartDrawerOpen; },
    setCartDrawer: (state, action: PayloadAction<boolean>) => { state.cartDrawerOpen = action.payload; },
    toggleSearch: (state) => { state.searchOpen = !state.searchOpen; },
    toggleNotifications: (state) => { state.notificationDrawerOpen = !state.notificationDrawerOpen; },
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => { state.theme = action.payload; },
  },
});

export const {
  toggleSidebar, setSidebarOpen, toggleCartDrawer, setCartDrawer,
  toggleSearch, toggleNotifications, setTheme,
} = uiSlice.actions;
export default uiSlice.reducer;

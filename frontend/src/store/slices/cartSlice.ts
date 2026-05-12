import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Cart, CartItem } from '../../types';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
}

const initialState: CartState = {
  cart: null,
  isLoading: false,
  itemCount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
      state.itemCount = action.payload.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    clearCart: (state) => {
      state.cart = null;
      state.itemCount = 0;
    },
    setCartLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCart, clearCart, setCartLoading } = cartSlice.actions;
export default cartSlice.reducer;

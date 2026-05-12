import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { setCart, clearCart, setCartLoading } from '../../store/slices/cartSlice';
import type { Cart } from '../../types';

const makeStore = () =>
  configureStore({ reducer: { cart: cartReducer } });

const makeCart = (overrides: Partial<Cart> = {}): Cart => ({
  _id: 'cart-1',
  user: 'user-1',
  items: [
    {
      _id: 'item-1',
      product: {
        _id: 'prod-1',
        name: 'Test Product',
        slug: 'test-product',
        price: 49.99,
        images: [],
        stock: 10,
      } as never,
      quantity: 2,
      price: 49.99,
    },
    {
      _id: 'item-2',
      product: {
        _id: 'prod-2',
        name: 'Another Product',
        slug: 'another-product',
        price: 19.99,
        images: [],
        stock: 5,
      } as never,
      quantity: 3,
      price: 19.99,
    },
  ],
  totalAmount: 159.95,
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('cartSlice — reducers', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
  });

  it('starts with empty cart state', () => {
    const { cart } = store.getState();
    expect(cart.cart).toBeNull();
    expect(cart.itemCount).toBe(0);
    expect(cart.isLoading).toBe(false);
  });

  it('setCart stores cart and computes total item count', () => {
    const cart = makeCart();
    store.dispatch(setCart(cart));

    const state = store.getState().cart;
    expect(state.cart).toEqual(cart);
    // 2 + 3 = 5
    expect(state.itemCount).toBe(5);
  });

  it('setCart with single item sets count to that quantity', () => {
    const cart = makeCart({
      items: [
        {
          _id: 'item-1',
          product: { _id: 'p1' } as never,
          quantity: 7,
          price: 10,
        },
      ],
    });
    store.dispatch(setCart(cart));
    expect(store.getState().cart.itemCount).toBe(7);
  });

  it('setCart with empty items array sets count to 0', () => {
    store.dispatch(setCart(makeCart({ items: [] })));
    expect(store.getState().cart.itemCount).toBe(0);
  });

  it('clearCart resets to initial state', () => {
    store.dispatch(setCart(makeCart()));
    store.dispatch(clearCart());

    const state = store.getState().cart;
    expect(state.cart).toBeNull();
    expect(state.itemCount).toBe(0);
  });

  it('setCartLoading true sets isLoading', () => {
    store.dispatch(setCartLoading(true));
    expect(store.getState().cart.isLoading).toBe(true);
  });

  it('setCartLoading false clears isLoading', () => {
    store.dispatch(setCartLoading(true));
    store.dispatch(setCartLoading(false));
    expect(store.getState().cart.isLoading).toBe(false);
  });

  it('replaces cart on successive setCart calls', () => {
    store.dispatch(setCart(makeCart()));

    const replacementCart = makeCart({
      _id: 'cart-2',
      items: [
        {
          _id: 'item-x',
          product: { _id: 'p-x' } as never,
          quantity: 1,
          price: 9.99,
        },
      ],
    });
    store.dispatch(setCart(replacementCart));

    expect(store.getState().cart.cart?._id).toBe('cart-2');
    expect(store.getState().cart.itemCount).toBe(1);
  });
});

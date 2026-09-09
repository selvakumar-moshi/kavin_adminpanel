import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import SuperSalesReducer from "./CSuperSales";

export const Store = configureStore({
    reducer: {
        superSales: SuperSalesReducer,
    },
});

setupListeners(Store.dispatch);

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;
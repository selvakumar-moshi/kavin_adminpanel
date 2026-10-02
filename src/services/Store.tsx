import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import LearningReducer from "./CLearning";

export const Store = configureStore({
    reducer: {
        learning: LearningReducer,
    },
});

setupListeners(Store.dispatch);

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;
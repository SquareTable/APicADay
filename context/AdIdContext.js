import { createContext } from "react";
import { TestIds } from "react-native-google-mobile-ads";

export const AdIdContext = createContext({adId: TestIds.BANNER, setAdId: () => {}})
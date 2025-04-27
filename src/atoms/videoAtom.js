
import { atom } from "jotai";

export const videosLoadingAtom = atom(false);
export const totalPagesAtom = atom(1);

//Lưu thông tin video cục bộ
export const searchTermAtom = atom("");
export const currentPageAtom = atom(1);
export const startDateAtom = atom("");
export const endDateAtom = atom("");

// Hiển thị video 
export const videosAtom = atom([]);
export const mediaUrlsAtom = atom({});
export const loadingMediaAtom = atom({});
export const isFetchingAtom = atom(false);
export const refreshTriggerAtom = atom(0);
export const loadingAtom = atom(true);
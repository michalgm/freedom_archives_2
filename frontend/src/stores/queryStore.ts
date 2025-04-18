
import { cloneDeep, merge } from "lodash-es";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from 'zustand/middleware/immer';
// Store for search state (synced with URL params)
// const useQueryStore = create(
//   subscribeWithSelector((set) => ({
//     search: {
//       type: "",
//       query: {},
//       total: 0,
//       index: 0,
//       ids: [],
//     },
//     search_index: 0,

//     setSearch: (searchData) => set({ search: searchData }),
//     setSearchIndex: (index) => set({ search_index: index }),
//     resetSearch: () =>
//       set({
//         search: {
//           type: "",
//           query: {},
//           total: 0,
//           index: 0,
//           ids: [],
//         },
//         search_index: 0,
//       }),
//   }))
// );
interface FilterItem {
  field: string | null;
  value: string | number | boolean | undefined | FilterItem[];
}

// Define types for search state
interface SearchFilter {
  [key: string]: string | number | boolean | undefined | FilterItem[];
  filters?: FilterItem[];
}

interface SearchData {
  type: string;
  filter: SearchFilter;
  total: number;
  index: number;
  ids: string[];
  offset: number;
}
enum SearchTypes {
  'records',
  'collections'
}

interface SearchState {
  search: SearchData;
  search_index: number;
  searchType: SearchTypes | null
}

interface Actions {
  // Actions
  setSearch: (searchData: SearchData) => void;
  setFilter: (filter: SearchFilter) => void;
  setSearchType: (type: SearchTypes | null) => void;
  setSearchIndex: (index: number) => void;
  resetSearch: () => void;
}

const initialSearch: SearchData = {
  type: "",
  filter: {
    filters: []
  },
  total: 0,
  index: 0,
  ids: [],
  offset: 0,
};

// const getUrlSearch = () => {
//   return window.location.search.slice(1)
// }

// const persistentStorage: StateStorage = {
//   getItem: (key): string => {
//     // Check URL first
//     if (getUrlSearch()) {
//       const searchParams = new URLSearchParams(getUrlSearch())
//       const storedValue = searchParams.get(key)
//       console.log('GEEETTT', storedValue)
//       return JSON.parse(storedValue as string)
//     } else {
//       // Otherwise, we should load from localstorage or alternative storage
//       return JSON.parse(localStorage.getItem(key) as string)
//     }
//   },
//   setItem: (key, newValue): void => {
//     console.log(key, newValue, getUrlSearch())
//     // Check if query params exist at all, can remove check if always want to set URL
//     if (getUrlSearch()) {
//       const searchParams = new URLSearchParams(getUrlSearch())
//       searchParams.set(key, JSON.stringify(newValue))
//       window.history.replaceState(null, '', `?${searchParams.toString()}`)
//     }

//     localStorage.setItem(key, JSON.stringify(newValue))
//   },
//   removeItem: (key): void => {
//     const searchParams = new URLSearchParams(getUrlSearch())
//     searchParams.delete(key)
//     window.location.search = searchParams.toString()
//   },
// }



const storageOptions = {
  name: 'queryStore',
  // storage: createJSONStorage<SearchState>(() => persistentStorage),
  storage: createJSONStorage<SearchState>(() => localStorage),
}

const useQueryStore = create<SearchState & Actions>()(
  persist(
    immer((set) => ({
      search: initialSearch,
      searchType: null,
      search_index: 0,

      setSearchType: (type) => set({ searchType: type }),

      setSearch: (searchData) => set((state) => {
        // With Immer, you can use merge directly on state
        merge(state.search, searchData);
      }),

      setFilter: (filterData) => set((state) => {
        state.search.filter = cloneDeep(filterData);
      }),

      setSearchIndex: (index) => set(state => { state.search_index = index }),
      resetSearch: () => set((state) => {
        state.search = cloneDeep(initialSearch);
        state.search_index = 0;
      }, true),
    })),
    storageOptions,
  ),
)

export default useQueryStore
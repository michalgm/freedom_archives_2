
import { Query } from "@feathersjs/feathers";
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
  search: string;
  hidden: boolean;
  sort: string;
  sort_desc: boolean;
  needs_review: boolean;
  [key: string]: string | number | boolean | undefined | FilterItem[];
  filters?: FilterItem[];
}

interface RecordSearchFilter extends SearchFilter {
  non_digitized: boolean;
  collection_id: number | null;
}

interface SearchData {
  type: string;
  filter: SearchFilter;
  total: number;
  offset: number;
  query: Query
}

interface RecordSearchData extends SearchData {
  filter: RecordSearchFilter;
}

interface SearchState<T extends SearchData> {
  search: T;
  search_index: number;
}

export type SearchType = "records" | "collections";

interface Actions<T extends SearchData> {
  // Actions
  setSearch: (searchData: Partial<T>) => void;
  setFilter: (filter: SearchFilter) => void;
  setSearchIndex: (index: number) => void;
  resetSearch: () => void;
}

const initialSearchData: SearchData = {
  type: "",
  filter: {
    hidden: false,
    needs_review: false,
    search: "",
    filters: [],
    sort: 'relevance',
    sort_desc: false
  },
  total: 0,
  offset: 0,
  query: {}
};

export const initialSearch = {
  records: {
    search: {
      ...initialSearchData,
      filter: {
        ...initialSearchData.filter,
        non_digitized: false,
        collection_id: null
      }
    },
    search_index: 0,
  } as SearchState<RecordSearchData>,
  collections: {
    search: {
      ...initialSearchData,
    },
    search_index: 0,
  } as SearchState<SearchData>,
}

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

const getStateManager = (initialData) => (set) => ({
  search: initialData,
  search_index: 0,
  setSearch: (searchData) => set((state) => {
    state.search = { ...state.search, ...searchData };
  }),

  setFilter: (filterData) => set((state) => {
    state.search.filter = structuredClone(filterData);
  }),

  setSearchIndex: (index) => set((state) => {
    state.search_index = index;
  }),

  resetSearch: () => set((state) => {
    state.search = initialData;
    state.search_index = 0;
  }),
})

export const createQueryStore = <T extends SearchData>(type: SearchType, persistStore: boolean = false) => {
  const initialData = initialSearch[type].search
  const baseStore = immer<SearchState<T> & Actions<T>>(getStateManager(initialData))

  if (persistStore) {
    return create<SearchState<T> & Actions<T>>()(persist(baseStore, {
      name: `queryStore-${type}`,
      storage: createJSONStorage(() => localStorage),
    }))
  }

  return create<SearchState<T> & Actions<T>>()(baseStore)
}

const useRecordsQueryStore = createQueryStore('records', true);
const useCollectionsQueryStore = createQueryStore('collections', true);

export const queryStores = {
  records: useRecordsQueryStore,
  collections: useCollectionsQueryStore
}
import axiosInstance from "./axiosInstance";
import documentsApi from "./documentsApi";
import categoriesAPI from "./categoriesAPI";
import tagsAPI from "./tagsAPI";

jest.mock("./axiosInstance", () => ({ get: jest.fn(), post: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

test.each(["C++", "a&b", "C#"])("search preserves keyword %s as a query parameter", (search) => {
  documentsApi.getSearchDocuments(search, 1, 10);
  categoriesAPI.getBySearch(search);
  tagsAPI.getBySearch(search);
  expect(axiosInstance.get.mock.calls).toEqual([
    ["public/search-documents", { params: { search, PageNumber: 1, PageSize: 10 } }],
    ["public/search-category", { params: { search } }],
    ["Tags/public/search-tags", { params: { search } }],
  ]);
});

test("like request has no credentials inside the JSON body", () => {
  documentsApi.updateDocumentLikeStatus(42, 1);
  expect(axiosInstance.post).toHaveBeenCalledWith("Likes/reaction", null, { params: { documentId: 42, reaction: 1 } });
});

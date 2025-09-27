export const API_BASE_URL = 'http://localhost:4000/api'

export const API_URLS = {
  //Auth
  LOGIN: '/users/login',

  //Customers
  GET_CUSTOMERS: '/customers',
  CREATE_CUSTOMER: '/customers',
  GET_CUSTOMER_BY_ID: '/customers/', // + id
  UPDATE_CUSTOMER: '/customers/', // + id
  DELETE_CUSTOMER: '/customers/', // + id
  GET_CUSTOMERS_BY_VENDOR: '/customers/vendor/', // + vendorId
  GET_MY_CUSTOMERS: '/customers/my/customers',
  GET_EXPIRING_LICENSE_CUSTOMERS: '/customers/expiring/license',
  GET_CUSTOMERS_BY_CATEGORY: '/customers/vendor/', // + vendorId + '/category/' + customerCategory
  GET_CUSTOMERS_BY_LOCATION: '/customers/vendor/', // + vendorId + '/location/' + customerProvince
  TOGGLE_CUSTOMER_STATUS: '/customers/', // + id + '/toggle-status'

  //Brands
  GET_BRANDS: '/brands',
  CREATE_BRAND: '/brands',
  GET_BRAND_BY_ID: '/brands/', // + id
  UPDATE_BRAND: '/brands/', // + id
  DELETE_BRAND: '/brands/', // + id
  TOGGLE_BRAND_STATUS: '/brands/', // + id + '/toggle-status'


  //Employees
  GET_EMPLOYEES: '/employees',
  CREATE_EMPLOYEE: '/employees',
  GET_EMPLOYEE_BY_ID: '/employees/', // + id
  UPDATE_EMPLOYEE: '/employees/', // + id
  DELETE_EMPLOYEE: '/employees/', // + id
  TOGGLE_EMPLOYEE_STATUS: '/employees/', // + id + '/toggle-status'

  //Areas
  GET_AREAS: '/areas',
  CREATE_AREA: '/areas',
  GET_AREA_BY_ID: '/areas/', // + id
  UPDATE_AREA: '/areas/', // + id
  DELETE_AREA: '/areas/', // + id
  TOGGLE_AREA_STATUS: '/areas/', // + id + '/toggle-status'

  //Sub Areas
  GET_SUB_AREAS: '/subareas',
  CREATE_SUB_AREA: '/subareas',
  GET_SUB_AREA_BY_ID: '/subareas/', // + id
  UPDATE_SUB_AREA: '/subareas/', // + id
  DELETE_SUB_AREA: '/subareas/', // + id
  TOGGLE_SUB_AREA_STATUS: '/subareas/', // + id + '/toggle-status'
  GET_MY_SUB_AREAS: '/subareas/my/subareas',
  GET_SUB_AREAS_BY_VENDOR: '/subareas/vendor/subareas',
  GET_SUB_AREAS_BY_AREA: '/subareas/area/', // + areaId
  GET_SUB_AREAS_BY_NAME: '/subareas/search/', // + subAreaName

  //Groups
  GET_GROUPS: '/groups',
  CREATE_GROUP: '/groups',
  GET_GROUP_BY_ID: '/groups/', // + id
  UPDATE_GROUP: '/groups/', // + id
  DELETE_GROUP: '/groups/', // + id
  TOGGLE_GROUP_STATUS: '/groups/', // + id + '/toggle-status'
  GET_MY_GROUPS: '/groups/my/groups',
  GET_GROUPS_BY_VENDOR: '/groups/vendor/groups',
  GET_GROUPS_BY_BRAND: '/groups/brand/', // + brandId
  GET_UNIQUE_GROUPS_BY_BRAND: '/groups/unique/brand/', // + brandId
  GET_ALL_UNIQUE_GROUPS: '/groups/unique/all',
  //Sub Groups
  GET_SUB_GROUPS: '/subgroups',
  CREATE_SUB_GROUP: '/subgroups',
  GET_SUB_GROUP_BY_ID: '/subgroups/', // + id
  UPDATE_SUB_GROUP: '/subgroups/', // + id
  DELETE_SUB_GROUP: '/subgroups/', // + id
  TOGGLE_SUB_GROUP_STATUS: '/subgroups/', // + id + '/toggle-status'
  GET_MY_SUB_GROUPS: '/subgroups/my/subgroups',
  GET_SUB_GROUPS_BY_GROUP: '/subgroups/group/', // + groupId
  GET_SUB_GROUPS_BY_NAME: '/subgroups/search/', // + subGroupName
  GET_GROUPS_BY_NAME: '/groups/search/', // + group

  //Products
  GET_PRODUCTS: '/products',
  CREATE_PRODUCT: '/products',
  GET_PRODUCT_BY_ID: '/products/', // + id
  UPDATE_PRODUCT: '/products/', // + id
  DELETE_PRODUCT: '/products/', // + id
  TOGGLE_PRODUCT_STATUS: '/products/', // + id + '/toggle-status'
  GET_MY_PRODUCTS: '/products/my/products',
  GET_PRODUCT_STATS: '/products/stats',
  GET_PRODUCTS_BY_BRAND: '/products/brand/', // + brandId
  GET_PRODUCTS_BY_GROUP: '/products/group/', // + groupId
  GET_PRODUCTS_BY_SUBGROUP: '/products/subgroup/', // + subGroupId


  // Purchase Invoices
  GET_PURCHASE_INVOICES: '/purchase-invoices',
  CREATE_PURCHASE_INVOICE: '/purchase-invoices',
  GET_PURCHASE_INVOICE_BY_ID: '/purchase-invoices/', // + id
  UPDATE_PURCHASE_INVOICE: '/purchase-invoices/', // + id
  DELETE_PURCHASE_INVOICE: '/purchase-invoices/', // + id
  TOGGLE_PURCHASE_INVOICE_STATUS: '/purchase-invoices/', // + id + '/toggle-status'
  GET_MY_PURCHASE_INVOICES: '/purchase-invoices/my/invoices',
  GET_PURCHASE_INVOICE_STATS: '/purchase-invoices/stats',
  GET_PURCHASE_INVOICES_BY_VENDOR: '/purchase-invoices/vendor/', // + vendorId
  GET_PURCHASE_INVOICES_BY_GROUP: '/purchase-invoices/group/', // + groupId,

  //Purchase Entries
  GET_PURCHASE_ENTRIES: '/purchase-entries',
  CREATE_PURCHASE_ENTRY: '/purchase-entries',
  GET_PURCHASE_ENTRY_BY_ID: '/purchase-entries/', // + id
  UPDATE_PURCHASE_ENTRY: '/purchase-entries/', // + id
  DELETE_PURCHASE_ENTRY: '/purchase-entries/', // + id
  TOGGLE_PURCHASE_ENTRY_STATUS: '/purchase-entries/', // + id + '/toggle-status'
  GET_PURCHASE_STATS: '/purchase-entries/stats',
  GET_PURCHASE_ENTRIES_BY_DATE_RANGE: '/purchase-entries/date-range',
  GET_LAST_INVOICE_BY_BRAND: '/purchase-entries/last-invoice/', // + brandId

  //Lookup
  getAllProvinces: '/lookup/provinces',
  getCitiesByProvince: '/lookup/cities',
  getAllCategories: '/lookup/categories',
  getAllDesignations: '/lookup/designations',
  getAllCities: '/lookup/all-cities',
  getAreasLookup: '/lookup/areas',
  getSubAreasLookup: '/lookup/subareas',
  getBrandsLookup: '/lookup/brands',
  getGroupsLookup: '/lookup/groups',
  getSubGroupsLookup: '/lookup/subgroups',

  //Inventory
  GET_GROUPED_INVENTORY: '/inventory/grouped',
  GET_BATCH_DETAILS_BY_PRODUCT: '/inventory/batch-details/', // + productId
  GET_INVENTORY_SUMMARY: '/inventory/summary',
  GET_INVENTORY_VALUE: '/inventory/value',
  GET_LOW_STOCK_ITEMS: '/inventory/low-stock',
  GET_OUT_OF_STOCK_ITEMS: '/inventory/out-of-stock',
  GET_EXPIRING_PRODUCTS: '/inventory/expiring',
  GET_EXPIRED_PRODUCTS: '/inventory/expired',
}

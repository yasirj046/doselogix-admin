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
  GET_SUB_GROUPS: '/groups/subgroups',
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

  //Lookup
  getAllProvinces: '/lookup/provinces',
  getCitiesByProvince: '/lookup/cities',
  getAllCategories: '/lookup/categories',
  getAllDesignations: '/lookup/designations',
  getAllCities: '/lookup/all-cities',
  getAreasLookup: '/lookup/areas',
  getSubAreasLookup: '/lookup/subareas',
}

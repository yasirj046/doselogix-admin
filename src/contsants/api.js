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

  //Lookup
  getAllProvinces: '/lookup/provinces',
  getCitiesByProvince: '/lookup/cities',
  getAllCategories: '/lookup/categories'
}

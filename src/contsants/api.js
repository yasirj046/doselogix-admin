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
  getAreasByCustomersSalesLookup: '/lookup/areas-by-customers-sales',
  getSubAreasLookup: '/lookup/subareas',
  getSubAreasByCustomersSalesLookup: '/lookup/subareas-by-customers-sales',
  getBrandsLookup: '/lookup/brands',
  getGroupsLookup: '/lookup/groups',
  getSubGroupsLookup: '/lookup/subgroups',
  getCustomersLookup: '/lookup/customers',
  getEmployeesLookup: '/lookup/employees',
  getProductsLookup: '/lookup/products',
  getExpenseLookup: '/lookup/expense-categories',

  //Sales Invoices
  GET_SALES_INVOICES: '/sales-invoices',
  CREATE_SALES_INVOICE: '/sales-invoices',
  GET_SALES_INVOICE_BY_ID: '/sales-invoices/', // + id
  UPDATE_SALES_INVOICE: '/sales-invoices/', // + id
  DELETE_SALES_INVOICE: '/sales-invoices/', // + id
  TOGGLE_SALES_INVOICE_STATUS: '/sales-invoices/', // + id + '/toggle-status'
  GET_SALES_STATISTICS: '/sales-invoices/statistics',
  GET_LAST_INVOICE_BY_CUSTOMER: '/sales-invoices/last-invoice/', // + customerId
  ADD_SALES_PAYMENT: '/sales-invoices/', // + id + '/add-payment'
  REMOVE_SALES_PAYMENT: '/sales-invoices/', // + id + '/remove-payment/'
  GET_SALES_SUMMARY: '/sales-invoices/summary',
  GET_PRODUCT_SALES_ANALYTICS: '/sales-invoices/analytics/products',
  GET_LOW_STOCK_ALERTS: '/sales-invoices/alerts/low-stock',
  GET_CUSTOMER_BALANCE: '/sales-invoices/customer/', // + customerId + '/balance'
  GET_AVAILABLE_INVENTORY: '/sales-invoices/inventory/', // + productId
  GET_PRICE_HISTORY: '/sales-invoices/price-history', // ?customerId=&productId=
  GET_NEXT_INVOICE_NUMBER: '/sales-invoices/next-invoice-number', // ?date=
  GET_CUSTOMER_SALES_HISTORY: '/sales-invoices/customer/', // + customerId + '/history'
  GET_EMPLOYEE_SALES_PERFORMANCE: '/sales-invoices/employee/performance',

  //Expenses
  GET_EXPENSES: '/expenses',
  CREATE_EXPENSE: '/expenses',
  GET_EXPENSE_BY_ID: '/expenses/', // + id
  UPDATE_EXPENSE: '/expenses/', // + id
  DELETE_EXPENSE: '/expenses/', // + id
  TOGGLE_EXPENSE_STATUS: '/expenses/', // + id + '/toggle-status'
  GET_MY_EXPENSES: '/expenses/my/expenses',
  GET_EXPENSE_STATS: '/expenses/stats',
  GET_EXPENSES_BY_CATEGORY: '/expenses/category/', // + expenseCategory
  GET_EXPENSES_BY_DATE_RANGE: '/expenses/date-range',
  // GET_EXPENSE_CATEGORIES: '/expenses/categories',

  //Inventory
  GET_GROUPED_INVENTORY: '/inventory/grouped',
  GET_BATCH_DETAILS_BY_PRODUCT: '/inventory/batch-details/', // + productId
  GET_INVENTORY_SUMMARY: '/inventory/summary',
  GET_INVENTORY_VALUE: '/inventory/value',
  GET_LOW_STOCK_ITEMS: '/inventory/low-stock',
  GET_OUT_OF_STOCK_ITEMS: '/inventory/out-of-stock',
  GET_EXPIRING_PRODUCTS: '/inventory/expiring',
  GET_EXPIRED_PRODUCTS: '/inventory/expired',

  //Delivery Logs
  GET_DELIVERY_LOGS: '/delivery-logs',
  CREATE_DELIVERY_LOG: '/delivery-logs',
  GET_DELIVERY_LOG_BY_ID: '/delivery-logs/', // + id
  UPDATE_DELIVERY_LOG: '/delivery-logs/', // + id
  DELETE_DELIVERY_LOG: '/delivery-logs/', // + id
  TOGGLE_DELIVERY_LOG_STATUS: '/delivery-logs/', // + id + '/toggle-status'
  RECALCULATE_DELIVERY_LOG_TOTAL: '/delivery-logs/', // + id + '/recalculate'
  SYNC_MISSING_INVOICES: '/delivery-logs/sync-missing-invoices',
  GET_DELIVERY_LOGS_BY_DATE_RANGE: '/delivery-logs/date-range',
  GET_DELIVERY_LOG_STATS: '/delivery-logs/stats',
  GET_DELIVERY_LOG_PREVIEW_NUMBER: '/delivery-logs/preview-number',

  // Reports - Customer Report
  GET_CUSTOMER_REPORT: '/reports/customers',
  GET_CUSTOMER_DETAILED_REPORT: '/reports/customers/', // + customerId
  GET_CUSTOMER_REPORT_INVOICE: '/reports/customers/invoice/', // + invoiceId
  EXPORT_CUSTOMER_REPORT: '/reports/customers/export',

  // Reports - Brand Report
  GET_BRAND_REPORT: '/reports/brands',
  GET_BRAND_DETAILED_REPORT: '/reports/brands/', // + brandId
  GET_BRAND_REPORT_INVOICE: '/reports/brands/invoice/', // + invoiceId
  EXPORT_BRAND_REPORT: '/reports/brands/export',

  // Reports - Product Report
  GET_PRODUCT_REPORT: '/reports/products',
  GET_PRODUCT_DETAILED_REPORT: '/reports/products/', // + productId/:customerId
  EXPORT_PRODUCT_REPORT: '/reports/products/export',

  // Dashboard
  GET_DASHBOARD_SUMMARY_CARDS: '/dashboard/summary-cards',
  GET_DASHBOARD_BRAND_SALES: '/dashboard/brand-wise-sales',
  GET_DASHBOARD_TOP_PRODUCTS: '/dashboard/top-products',
  GET_DASHBOARD_RECEIVABLES_AGING: '/dashboard/receivables-aging',
  GET_DASHBOARD_STOCK_ALERTS: '/dashboard/stock-alerts',
  GET_DASHBOARD_NEAR_EXPIRY: '/dashboard/near-expiry',
  GET_DASHBOARD_AREA_SALES: '/dashboard/area-wise-sales',
  GET_DASHBOARD_INVOICE_BREAKDOWN: '/dashboard/invoice-breakdown',
  GET_DASHBOARD_COMPLETE: '/dashboard/complete',
}

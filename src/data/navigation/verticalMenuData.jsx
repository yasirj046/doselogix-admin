// import { Children } from "react"

const verticalMenuData = dictionary => [
  {
    label: "Customers",
    href: '/users',
    icon: 'tabler-user'
  },
  {
    label: "Brands",
    href: '/brands',
    icon: 'tabler-building-store'
  },
  {
    label: "Employees",
    href: '/employees',
    icon: 'tabler-users'
  },
  {
    label: "Areas & Sub Areas",
    icon: 'tabler-map-pin',
    children: [
      {
        label: "Areas",
        href: '/areas',
        icon: 'tabler-circle'
      },
      {
        label: "Sub Areas",
        href: '/sub-areas',
        icon: 'tabler-circle'
      }
    ]
  },
  {
    label: "Groups & Sub-Groups",
    icon: 'tabler-category',
    children: [
      {
        label: "Groups",
        href: '/groups',
        icon: 'tabler-category'
      },
      {
        label: "Sub Groups",
        href: '/sub-groups',
        icon: 'tabler-category'
      }
    ]
  },
  {
    label: "Products",
    href: '/products',
    icon: 'tabler-box'
  },
  {
    label: "Purchase Invoices",
    href: '/purchaseInvoice',
    icon: 'tabler-file-invoice'
  },
  {
    label: "Inventory",
    href: '/inventory',
    icon: 'tabler-package'
  },
  {
    label: "Sales Invoices",
    href: '/sales-invoice',
    icon: 'tabler-invoice'
  },
  {
    label: "Delivery Logs",
    href: '/delivery-log',
    icon: 'tabler-truck-delivery'
  },
  {
    label: "Reports",
    icon: 'tabler-report',
    children: [
      // {
      //   label: "Sales Reports",
      //   href: '/reports/sales',
      //   icon: 'tabler-chart-line'
      // },
      // {
      //   label: "Purchase Reports",
      //   href: '/reports/purchase',
      //   icon: 'tabler-shopping-cart'
      // },
      {
        label: "Product Reports",
        href: '/reports/products',
        icon: 'tabler-box'
      },
      {
        label: "Brand Reports",
        href: '/reports/brands',
        icon: 'tabler-building-store'
      },
      {
        label: "Customer Reports",
        href: '/reports/customers',
        icon: 'tabler-users'
      }
    ]
  },
  {
    label: "Expenses",
    href: '/expenses',
    icon: 'tabler-currency-dollar'
  },
  {
    label: "Ledger",
    href: '/ledger',
    icon: 'tabler-book'
  }
]

export default verticalMenuData

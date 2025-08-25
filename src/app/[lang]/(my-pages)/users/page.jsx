// Component Imports
import UserList from '@views/my-pages/users'

// Data Imports
import { getUserData } from '@/app/server/actions'

const UserListApp = async () => {
  // Vars
  const data = await getUserData()

  return <UserList userData={data} />
}

export default UserListApp

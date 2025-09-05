"use client";

import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Search from "@/components/shared/search";
import { useRouter, useSearchParams } from "next/navigation";
import { User, UserRole } from "@prisma/client";
import { getAllClerkUsers, getAllUsers, updateUserRole } from "@/lib/actions/user.action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingLogo from "@/components/shared/loadingLogo";

const UpdateRoleContent = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchUsers = async () => {
    setLoading(true);
    try {
      const searchText = searchParams.get("query") || "";
      const role = searchParams.get("role") as UserRole | undefined;

      const response = await getAllClerkUsers(searchText, role);
      console.log(response, "response")
      if (response.users) setUsers(response.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

    fetchUsers();
  }, [searchParams]);

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    try {
      const response = await updateUserRole(userId, role);
      if (response.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, role } : user
          )
        );
      } else {
        console.error("Failed to update role:", response.error);
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  return (
      <>
        <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
          <h3 className="wrapper h3-bold text-center sm:text-left">Users</h3>
        </section>

        <section className="wrapper mt-8 flex flex-wrap items-center justify-between gap-4">
          <Search placeholder="Search user name..." />

          <div className="w-[200px]">
            <Select
              onValueChange={(value) =>
                router.push(
                  `?query=${searchParams.get("query") || ""}&role=${value}`
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>{" "}
                {/* Use "all" instead of empty string */}
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="EMPLOYER">EMPLOYER</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="wrapper overflow-x-auto">
          {loading ? (
            <p className="text-center text-gray-500 py-4">Loading users...</p>
          ) : (
            <table className="w-full border-collapse border-t">
              <thead>
                <tr className="p-medium-14 border-b text-grey-500">
                  <th className="min-w-[250px] py-3 text-left">User ID</th>
                  <th className="min-w-[200px] flex-1 py-3 pr-4 text-left">
                    Name
                  </th>
                  <th className="min-w-[150px] py-3 text-left">Email</th>
                  <th className="min-w-[100px] py-3 text-left">Role</th>
                  <th className="min-w-[150px] py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr className="border-b">
                    <td colSpan={6} className="py-4 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="p-regular-14 lg:p-regular-16 border-b"
                    >
                      <td className="min-w-[250px] py-4 text-primary-500">
                        {user.id}
                      </td>
                      <td className="min-w-[200px] flex-1 py-4 pr-4">
                        {user.fullName}
                      </td>
                      <td className="min-w-[150px] py-4">{user.email}</td>
                      <td className="min-w-[100px] py-4">{user.role}</td>
                      <td className="min-w-[150px] py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">Change Role</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateUserRole(user.id, "USER")
                              }
                            >
                              USER
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateUserRole(user.id, "ADMIN")
                              }
                            >
                              ADMIN
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateUserRole(user.id, "EMPLOYER")
                              }
                            >
                              EMPLOYER
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>
      </>
  );
};

const UpdateRole = () => {
  return (
    <Suspense fallback={<LoadingLogo />}>
      <UpdateRoleContent />
    </Suspense>
  )
}

export default UpdateRole;
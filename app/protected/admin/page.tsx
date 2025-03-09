import { currentRole } from "@/lib/auth";

const AdminPage = async () => {
  const role = await currentRole(); // Ensure this runs on the server

  return (
    <div>
      Current Role: {role}
    </div>
  );
};

export default AdminPage;

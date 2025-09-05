"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Search from "@/components/shared/search";
import { getOrdersByEvent } from "@/lib/actions/order.action";
import { formatDateTime, formatPrice } from "@/lib/utils";
import LoadingLogo from "@/components/shared/loadingLogo";
import SortableHeader from "@/components/shared/sortHeader";
import { useAuth, useUser } from "@clerk/nextjs";

interface Order {
  _id: string;
  eventTitle: string;
  buyer: string;
  createdAt: string;
  totalAmount: number;
}

const OrdersContent = () => {
  const { userId } = useAuth();
  const router = useRouter();
  console.log(userId, "user useUser")
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // if (!session?.user) {
    //   router.push("/login");
    //   return;
    // }

    // if (!session?.user?.isAdmin) {
    //   router.push("/");
    //   return;
    // }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const eventId = searchParams.get("eventId") || "";
        const searchText = searchParams.get("query") || "";
        const sort = (searchParams.get("sort") as "asc" | "desc") || "desc";

        const data = await getOrdersByEvent({ eventId, searchString: searchText, sort });
        if (data) {
          setOrders(
            data.map((order) => ({
              ...order,
              buyer: order.buyer ?? "", // Ensure buyer is always a string
              totalAmount: Number(order.totalAmount), // Ensure totalAmount is a number
              createdAt: new Date(order.createdAt).toISOString(), // Convert Date to string
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchParams]);

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Orders</h3>
      </section>

      <section className="wrapper mt-8">
        <Search placeholder="Search buyer name..." />
      </section>

      <section className="wrapper overflow-x-auto">
        {loading ? (
          <p className="text-center py-4">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No orders found.</p>
        ) : (
          <table className="w-full border-collapse border-t">
            <thead>
              <tr className="p-medium-14 border-b text-grey-500">
                <th className="min-w-[250px] py-3 text-left">Order ID</th>
                <th className="min-w-[200px] flex-1 py-3 pr-4 text-left">
                  Event Title
                </th>
                <th className="min-w-[150px] py-3 text-left">Buyer</th>
                <th className="min-w-[100px] py-3 text-left">
                  <SortableHeader/>
                </th>
                <th className="min-w-[100px] py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((row) => (
                <tr
                  key={row._id}
                  className="p-regular-14 lg:p-regular-16 border-b"
                  style={{ boxSizing: "border-box" }}
                >
                  <td className="min-w-[250px] py-4 text-primary-500">{row._id}</td>
                  <td className="min-w-[200px] flex-1 py-4 pr-4">{row.eventTitle}</td>
                  <td className="min-w-[150px] py-4">{row.buyer}</td>
                  <td className="min-w-[100px] py-4">
                    {formatDateTime(new Date(row.createdAt)).dateTime}
                  </td>
                  <td className="min-w-[100px] py-4 text-right">
                    {formatPrice(row.totalAmount.toString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
};

const Orders = () => {
  return (
    <Suspense fallback={<LoadingLogo />}>
      <OrdersContent />
    </Suspense>
  );
};

export default Orders;
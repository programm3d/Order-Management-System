import { useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import socketService from "../services/socket.service";
import { toast } from "react-hot-toast";

export const useWebSocket = () => {
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    if (token) {
      socketService.connect(token);

      if (user?.role === "customer") {
        socketService.on("orderCreated", (data) => {
          toast.success(`Order ${data.orderId} created successfully!`);
        });

        socketService.on("orderStatusUpdated", (data) => {
          toast.info(
            `Order ${data.orderId} status updated to ${data.newStatus}`
          );
        });
      } else if (["staff", "admin"].includes(user?.role)) {
        socketService.on("newOrder", (data) => {
          toast.success("New order received!", {
            duration: 5000,
          });
        });

        socketService.on("orderStatusChanged", (data) => {
          toast.info(
            `Order ${data.orderId} status changed to ${data.newStatus}`
          );
        });
      }

      return () => {
        socketService.removeAllListeners();
      };
    }
  }, [token, user]);

  return socketService;
};

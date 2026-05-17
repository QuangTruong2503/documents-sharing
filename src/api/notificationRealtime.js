import * as signalR from "@microsoft/signalr";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import config from "../config/config";

const subscribers = new Set();
let connection = null;
let activeToken = null;
let startPromise = null;

function getHubBaseUrl() {
  return (config.apiUrl || "").replace(/\/api\/?$/i, "").replace(/\/$/, "");
}

function getUnreadCountValue(payload) {
  return payload?.unread_count ?? payload?.unreadCount ?? 0;
}

function notifySubscribers(eventName, payload) {
  subscribers.forEach((subscriber) => {
    subscriber?.[eventName]?.(payload);
  });
}

function createConnection(token) {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${getHubBaseUrl()}/hubs/notifications`, {
      accessTokenFactory: () => Cookies.get("token") || token,
      withCredentials: false,
    })
    .withAutomaticReconnect()
    .build();
}

export function startNotificationRealtime() {
  const token = Cookies.get("token");
  if (!token || !getHubBaseUrl()) return Promise.resolve(null);

  if (connection && activeToken === token) {
    return startPromise || Promise.resolve(connection);
  }

  if (connection) {
    connection.stop().catch(() => {});
    connection = null;
  }

  activeToken = token;
  connection = createConnection(token);

  // connection.on("ReceiveNotification", (notification) => {
  //   notifySubscribers("onNotification", notification);
  //   if (notification?.title) {
  //     toast.info(notification.title);
  //   }
  // });

  connection.on("UnreadCountChanged", (payload) => {
    notifySubscribers("onUnreadCountChanged", getUnreadCountValue(payload));
  });

  connection.onreconnected(() => {
    notifySubscribers("onReconnected");
  });

  connection.onclose(() => {
    startPromise = null;
  });

  startPromise = connection
    .start()
    .then(() => connection)
    .catch((error) => {
      console.error("Cannot start notification realtime connection:", error);
      connection = null;
      activeToken = null;
      startPromise = null;
      return null;
    });

  return startPromise;
}

export function subscribeNotificationRealtime(subscriber) {
  subscribers.add(subscriber);
  startNotificationRealtime();

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0 && connection) {
      connection.stop().catch(() => {});
      connection = null;
      activeToken = null;
      startPromise = null;
    }
  };
}

export function stopNotificationRealtime() {
  subscribers.clear();
  if (connection) {
    connection.stop().catch(() => {});
  }
  connection = null;
  activeToken = null;
  startPromise = null;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setApiUser } from "./api-client";

const KEY = "bricoloop-user";
const Ctx = createContext<{ userId: string; setUserId: (id: string) => void }>({
  userId: "u1",
  setUserId: () => {},
});

/** Demo profile selector — NOT real authentication. */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [userId, setState] = useState("u1");
  const qc = useQueryClient();
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      setApiUser(saved);
      setState(saved);
      qc.invalidateQueries();
    }
  }, [qc]);
  const setUserId = (id: string) => {
    localStorage.setItem(KEY, id);
    setApiUser(id);
    setState(id);
    qc.invalidateQueries();
  };
  return <Ctx.Provider value={{ userId, setUserId }}>{children}</Ctx.Provider>;
}

export const useCurrentUser = () => useContext(Ctx);

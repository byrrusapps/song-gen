// hooks/useCloseDrawerOnNavigate.ts
import { useBeforeLeave } from "@solidjs/router";
import { useApp } from "../../context/app/App";

const useCloseDrawerOnNavigate = () => {
  const { drawer, setDrawer } = useApp();

  useBeforeLeave((e) => {
    if (drawer()) {
      e.preventDefault();
      setDrawer(false);
    }
  });
};

export default useCloseDrawerOnNavigate;
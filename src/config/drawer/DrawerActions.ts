import type { Component } from "solid-js";
import ChangeTheme from "../../components/drawer/ChangeTheme";
import DeleteAccount from "../../components/drawer/DeleteAccount";

export interface Action {
  component: Component;
  text: string;
}

export interface Actions {
  [key: string]: Action;
}
  const actions: Actions = {

          "app-theme":{
      component: ChangeTheme,
      text: "Choose App Theme",
    },

              "delete-account":{
      component: DeleteAccount,
      text: "Delete Account",
    },

}

export default actions;
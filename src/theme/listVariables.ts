import { MaterialDynamicColors } from "@material/material-color-utilities";

const listVariables = () => {

const cssVars = Object.keys(MaterialDynamicColors).map(
  (role) => "--md-sys-color-" + role.replace(/([A-Z])/g, "-$1").toLowerCase()
);

return(cssVars);

}

export default listVariables;

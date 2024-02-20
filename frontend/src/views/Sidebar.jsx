import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { EdgeSidebar, SidebarContent } from "@mui-treasury/layout";
import { Link, useLocation, useMatch, useResolvedPath } from "react-router-dom";

import React from "react";

const sideBarConfig = {
  Collections: [
    { label: "Manage Collections", icon: "", href: "/collections" },
    { label: "New Collection", icon: "", href: "/collections/new" },
    {
      label: "Manage Featured Collections",
      icon: "",
      href: "/collections/featured",
    },
  ],
  Records: [
    { label: "Search Records", icon: "", href: "/search" },
    { label: "Manage Records", icon: "", href: "/records" },
    { label: "New Record", icon: "", href: "/records/new" },
    { label: "Manage Featured Records", icon: "", href: "/records/featured" },
  ],
  "Site Management": [
    { label: "Edit site header text", icon: "", href: "" },
    { label: "Edit Lists", icon: "", href: "" },
    { label: "Export Collections", icon: "", href: "" },
    { label: "Find Duplicate Records", icon: "", href: "" },
    { label: "Review Changes", icon: "", href: "" },
  ],
  Admin: [
    { label: "Update Unknown Relationships", icon: "", href: "/relationships" },
    { label: "Update Thumbnails", icon: "", href: "" },
    { label: "Update Keywords", icon: "", href: "" },
    { label: "Backup Database", icon: "", href: "" },
    { label: "Manage Users", href: "/users" },
    { label: "Publish/Restore Live Site" },
  ],
};

function Sidebar() {
  return (
    <EdgeSidebar anchor="left">
      <SidebarContent>
        {Object.keys(sideBarConfig).map((title) => {
          return (
            <div key={title}>
              <Divider />
              <List>
                <ListItem>
                  <Typography variant="h5">{title}</Typography>
                </ListItem>
                {sideBarConfig[title].map(({ label, href, icon }) => (
                  <SidebarItem
                    key={label}
                    label={label}
                    href={href}
                    icon={icon}
                  />
                ))}
              </List>
            </div>
          );
        })}
      </SidebarContent>
      {/* <EdgeTrigger target={{ anchor: "left", field: "collapsed" }} /> */}
    </EdgeSidebar>
  );
}

function SidebarItem({ label, /* icon, */ href = "notalink" }) {
  const { pathname = null } = useResolvedPath(href);
  const location = useLocation();
  // console.log(location)?
  // console.log(useMatch({path: pathname || ''}))
  const current =
    Boolean(
      useMatch({ path: pathname || "" }) !== null ||
        (location.pathname === "/" && href === "/records")
    ) && href;
  // const home = Boolean(useMatch({path: href==='records' ? '/' : 'notalink'}))

  // console.log({href, pathname, current, home})
  return (
    <ListItemLink button selected={Boolean(current)} href={href}>
      <ListItemText>{label}</ListItemText>
    </ListItemLink>
  );
}

function ListItemLink(props) {
  return (
    <ListItem
      button
      disabled={!props.href}
      component={props.href ? Link : "div"}
      to={props.href}
      {...props}
    />
  );
}

export default Sidebar;

import React from 'react';
import {
  Divider,
  List,
  ListItem,
  Typography,
  ListItemText,
} from '@material-ui/core';
import {
  getDrawerSidebar,
  getSidebarContent,
  getCollapseBtn,
} from '@mui-treasury/layout';
import styled from 'styled-components';
import { useRouteMatch, Link } from 'react-router-dom';

const sideBarConfig = {
  Collections: [
    { label: 'Manage Collections', icon: '', href: '/collections' },
    { label: 'New Collection', icon: '', href: '' },
    { label: 'Manage Featured Collections', icon: '', href: '' },
  ],
  Records: [
    { label: 'Manage Records', icon: '', href: '/records' },
    { label: 'New Record', icon: '', href: '' },
    { label: 'Manage Featured Records', icon: '', href: '' },
  ],
  'Site Management': [
    { label: 'Edit site header text', icon: '', href: ''},
    { label: 'Edit Lists', icon: '', href: ''},
    { label: 'Export Collections', icon: '', href: ''},
    { label: 'Find Duplicate Records', icon: '', href: ''},
    { label: 'Review Changes', icon: '', href: ''},

  ],
  Admin: [
    { label: 'Update Unknown Relationships', icon: '', href: '/relationships' },
    { label: 'Update Thumbnails', icon: '', href: ''},
    { label: 'Update Keywords', icon: '', href: ''},
    { label: 'Backup Database', icon: '', href: ''},
    { label: 'Manage Users' },
    { label: 'Publish/Restore Live Site' }
  ],
};

const DrawerSidebar = getDrawerSidebar(styled);
const SidebarContent = getSidebarContent(styled);
const CollapseBtn = getCollapseBtn(styled);

function Sidebar() {
  return (
    <DrawerSidebar sidebarId={'primarySidebar'}>
      <SidebarContent>
        {Object.keys(sideBarConfig).map(title => {
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
      <CollapseBtn />
    </DrawerSidebar>
  );
}

function SidebarItem({ label, icon, href }) {
  const current = Boolean(useRouteMatch(href) !== null && href);
  return (
    <ListItemLink button selected={current} href={href}>
      <ListItemText>{label}</ListItemText>
    </ListItemLink>
  );
}

function ListItemLink(props) {
  return (
    <ListItem
      button
      disabled={!Boolean(props.href)}
      component={props.href ? Link : 'div'}
      to={props.href}
      {...props}
    />
  );
}

export default Sidebar;

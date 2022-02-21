import {
  Breadcrumbs as Crumbs,
  Icon,
  Typography
} from '@mui/material'
import {useStateValue, useTitle} from '../appContext'

import {Helmet} from 'react-helmet'
import Link from './Link';
import React from 'react'
import makeStyles from '@mui/styles/makeStyles';
import {startCase} from 'lodash';
import {
  useLocation
} from 'react-router-dom';

const useStyles = makeStyles({
  breadcrumbs: {
    flex: '1 1 auto',
    // width: '100%',
    minWidth: 0,
    "& > .MuiTypography-root": {
      color: 'white'
    },
    "& > .MuiTypography-root ol": {
      flexWrap: "nowrap",
      flex: "1 1 auto"
    },
    "& > .MuiTypography-root ol li": {
      minWidth: 0,
      flexWrap: "nowrap",
      flex: "0 0 auto"
    },
    "& > .MuiTypography-root ol li:last-child": {
      flex: "1 1 auto"
    },
    "& > .MuiTypography-root ol h6": {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0,
      flexWrap: "nowrap",
    }
  },
});

// const BCTitle = <Typography variant="h2" />

function Breadcrumbs() {
  const {state} = useStateValue()
  const setTitle = React.useRef(useTitle()).current
  const location = useLocation();
  const classes = useStyles();


  React.useEffect(() => {
    setTitle('')
  }, [location, setTitle]);

  const parts = location.pathname.split('/')
  const paths = [
    ...parts
      .map((p, index) => (index === 0 ?
        {link: '/', title: 'Freedom Archives Admin'} :
        {
          link: parts.slice(0, index + 1).join('/'),
          title: startCase(p)
        }))
      .filter(({title}) => title)
  ]
  if (state.title) {
    paths.pop();
    paths.push({link: location.pathname, title: state.title})
  }

  return (
    <div className={classes.breadcrumbs}>
      <Helmet>
        <title>
          {paths.map(({title}) => title).join(' – ')}
        </title>
      </Helmet>
      <Crumbs separator={<Icon>navigate_next</Icon>}>
        {
          paths.map(({link, title}) => {
            return <Typography variant="h6" key={link}>
              <Link color="inherit" to={`${link}`}>{title}</Link>
            </Typography>
          })
        }
      </Crumbs>
    </div>
  )
}

export default Breadcrumbs

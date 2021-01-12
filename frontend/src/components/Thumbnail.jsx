import React from 'react'
import {
  Avatar,
} from '@material-ui/core';
import { BrokenImage } from '@material-ui/icons';

const onError = (event)=> {
  event.target.src = `https://search.freedomarchives.org/images/fileicons/webpage.png`
}

export default function Thumbnail({src, type, width=75, alt=''}) {
  if (src) {
    return (
      <div style={{width, minWidth: width, marginRight: 10}}>
        <img
          style={{
            maxWidth: '100%',
          }}
          src={src}
          onError={onError}
          alt={alt}
        />
      </div>
    )
  } else {
    return <Avatar>
      <BrokenImage />
    </Avatar>
  }
}

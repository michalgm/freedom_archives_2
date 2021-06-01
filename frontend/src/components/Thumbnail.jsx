import {
  Avatar,
} from '@material-ui/core';
import { BrokenImage } from '@material-ui/icons';
import React from 'react'

const onError = (event)=> {
  event.target.src = `https://search.freedomarchives.org/images/fileicons/webpage.png`
}

export default function Thumbnail({src, type, width=75, alt=''}) {
  if (src) {
    return (
      <span style={{width, minWidth: width, display: 'block', marginRight: 10}}>
        <img
          style={{
            maxWidth: '100%',
          }}
          src={src}
          onError={onError}
          alt={alt}
        />
      </span>
    )
  } else {
    return <Avatar style={{width, height: width}}>
      <BrokenImage style={{fontSize: width * 0.6}} />
    </Avatar>
  }
}

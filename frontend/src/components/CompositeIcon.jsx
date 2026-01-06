import { Box } from '@mui/material'

const emptyObject = {}

const CompositeIcon = ({
  baseIcon: BaseIcon,
  overlayIcon: OverlayIcon,
  baseIconProps = emptyObject,
  overlayIconProps = emptyObject,
  size = 24,
  overlayPosition = 'bottom-right',
  overlaySize = 0.6, // Fraction of base icon size
  overlayOffset = 0.1, // Fraction of base icon size
  overlayOutline = true, // New prop to enable/disable outline
  overlayOutlineScale = 1, // How much larger the outline should be
  overlayOutlineColor = 'background.paper', // Color of the outline
  // overlayOutlineColor = 'red', // Color of the outline
  sx = emptyObject,
  ...props
}) => {
  const baseSize = size
  const overlayIconSize = size * overlaySize
  const outlineIconSize = overlayIconSize * overlayOutlineScale
  const offset = size * overlayOffset

  // Position calculations for overlay
  const getOverlayPosition = () => {
    switch (overlayPosition) {
      case 'top-left':
        return { top: -offset, left: -offset }
      case 'top-right':
        return { top: -offset, right: -offset }
      case 'bottom-left':
        return { bottom: -offset, left: -offset }
      case 'bottom-right':
      default:
        return { bottom: -offset, right: -offset }
      case 'center':
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
    }
  }

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: baseSize,
        height: baseSize,
        ...sx,
      }}
      {...props}
    >
      {/* Base Icon */}
      <BaseIcon
        sx={{
          fontSize: baseSize,
          ...baseIconProps.sx,
        }}
        {...baseIconProps}
      />

      {/* Overlay Icon with outline */}
      {OverlayIcon && (
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...getOverlayPosition(),
          }}
        >
          {/* Outline version (slightly larger, behind) */}
          {overlayOutline && (
            <OverlayIcon
              sx={(theme) => ({
                position: 'absolute',
                fontSize: outlineIconSize,
                color: overlayOutlineColor,
                filter: `drop-shadow(1px 0 0 ${theme.palette.background.paper}) drop-shadow(-1px 0 0 ${theme.palette.background.paper}) drop-shadow(0 1px 0 ${theme.palette.background.paper}) drop-shadow(0 -1px 0 ${theme.palette.background.paper}) drop-shadow(0.2px 0 0 ${theme.palette.background.paper}) drop-shadow(-0.2px 0 0 ${theme.palette.background.paper}) drop-shadow(0 0.2px 0 ${theme.palette.background.paper}) drop-shadow(0 -0.2px 0 ${theme.palette.background.paper})`,
              })}
              {...overlayIconProps}
            />
          )}

          {/* Main overlay icon (on top) */}
          <OverlayIcon
            sx={{
              position: 'relative',
              fontSize: overlayIconSize,
              zIndex: 1,
              ...overlayIconProps.sx,
            }}
            {...overlayIconProps}
          />
        </Box>
      )}
    </Box>
  )
}

export default CompositeIcon

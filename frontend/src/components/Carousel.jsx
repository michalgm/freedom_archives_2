import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { alpha, Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import React, { useEffect, useState } from "react";
import Thumbnail from "src/components/Thumbnail";
import { ItemLink } from "src/views/Public/ItemCard";

const TEXT_PADDING = 48;

// Carousel slide component
const CarouselSlide = ({ item, index, selectedIndex, width }) => (
  <Box
    key={item.id || item.title || `slide-${index}`}
    sx={(_theme) => ({
      flex: `0 0 ${width + TEXT_PADDING}px`,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      mb: 1,
    })}
  >
    <ItemLink item={item}>
      <Box
        sx={(_theme) => ({
          backgroundColor: index === selectedIndex ? alpha(_theme.palette.primary.dark, 0.9) : "transparent",
          ":hover": {
            backgroundColor: index === selectedIndex ? alpha(_theme.palette.primary.main, 1) : "transparent",
          },
          py: 2,
          width: width + TEXT_PADDING,
          borderRadius: 1,
          opacity: index === selectedIndex ? 1 : 0.5,
          transition: "background-color 0.3s ease, opacity 0.3s ease",
        })}
      >
        {/* Image container - dynamic height based on content */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            //   px: 1,
          }}
        >
          <Thumbnail item={item} alt={item.title} width={width} />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            opacity: index === selectedIndex ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "primary.contrastText",
              fontWeight: 500,
              lineHeight: 1.3,
              px: 1,
              pt: 2,
              width: "100%",
              textAlign: "center",
            }}
          >
            {item.title}
          </Typography>
        </Box>
      </Box>
    </ItemLink>
  </Box>
);

// Navigation arrows component
const NavigationArrows = ({ items, scrollPrev, scrollNext, pauseAutoplay, startAutoplay }) => {
  if (items.length <= 1) return null;

  return (
    <>
      <IconButton
        onClick={scrollPrev}
        onMouseEnter={pauseAutoplay}
        onMouseLeave={startAutoplay}
        sx={{
          position: "absolute",
          left: 8,
          top: "40%", // Position relative to image area
          transform: "translateY(-50%)",
          bgcolor: "rgba(0, 0, 0, 0.5)",
          color: "white",
          zIndex: 4,
          "&:hover": {
            bgcolor: "rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        <ChevronLeft />
      </IconButton>

      <IconButton
        onClick={scrollNext}
        onMouseEnter={pauseAutoplay}
        onMouseLeave={startAutoplay}
        sx={{
          position: "absolute",
          right: 8,
          top: "40%", // Position relative to image area
          transform: "translateY(-50%)",
          bgcolor: "rgba(0, 0, 0, 0.5)",
          color: "white",
          zIndex: 4,
          "&:hover": {
            bgcolor: "rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        <ChevronRight />
      </IconButton>
    </>
  );
};

// Dot indicators component
const DotIndicators = ({ items, selectedIndex, scrollTo, width }) => {
  if (items.length <= 1) return null;

  return (
    <Box
      sx={{
        width,
        display: "flex",
        gap: 1,
        bgcolor: "rgba(0, 0, 0, 0.3)",
        px: 2,
        py: 1,
        borderRadius: 2,
        justifyContent: "center",
      }}
    >
      {items.map((item, index) => (
        <Tooltip
          title={
            <Stack direction="column" alignItems="center" spacing={1}>
              <Thumbnail item={item} alt={item.title} width={40} />
              <span>{item.title}</span>
            </Stack>
          }
          key={item.id || item.title || `dot-${index}`}
          arrow
        >
          <Box
            key={item.id || item.title || `dot-${index}`}
            onClick={() => scrollTo(index)}
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: index === selectedIndex ? "primary.main" : "rgba(255, 255, 255, 0.5)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: index === selectedIndex ? "primary.dark" : "rgba(255, 255, 255, 0.8)",
              },
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

// Custom hook for carousel functionality
const useCarouselControls = (autoAdvanceInterval) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const autoplay = React.useMemo(
    () =>
      Autoplay({
        delay: autoAdvanceInterval,
        stopOnMouseEnter: true,
        stopOnInteraction: false,
      }),
    [autoAdvanceInterval]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    autoplay,
  };
};

export function Carousel({ items = [], autoAdvanceInterval = 6000, width = 250, loop = true, ...props }) {
  const { selectedIndex, setSelectedIndex, autoplay } = useCarouselControls(autoAdvanceInterval);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop,
      align: "center",
    },
    [autoplay]
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, setSelectedIndex]);

  if (!items || items.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.100",
          borderRadius: 1,
        }}
      >
        No items to display
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ py: 1, position: "relative", ...props.sx }} {...props}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          borderRadius: 1,
          overflow: "visible", // Allow dots to extend outside
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          ...props.sx,
        }}
        {...props}
      >
        <Box
          ref={emblaRef}
          sx={{
            width: "100%",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
            }}
          >
            {items.map((item, index) => (
              <CarouselSlide
                key={item.id || item.title || `slide-${index}`}
                item={item}
                index={index}
                selectedIndex={selectedIndex}
                width={width}
              />
            ))}
          </Box>
        </Box>

        {/* Navigation arrows */}
        <NavigationArrows
          items={items}
          scrollPrev={() => emblaApi?.scrollPrev()}
          scrollNext={() => emblaApi?.scrollNext()}
          pauseAutoplay={() => emblaApi?.plugins()?.autoplay?.stop()}
          startAutoplay={() => emblaApi?.plugins()?.autoplay?.play()}
        />

        {/* Dot indicators */}
        <DotIndicators
          items={items}
          selectedIndex={selectedIndex}
          scrollTo={(index) => emblaApi?.scrollTo(index)}
          width={"75%"}
        />
      </Box>
    </Paper>
  );
}

export default Carousel;

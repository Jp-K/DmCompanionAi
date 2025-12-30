import { extendTheme, type ThemeConfig } from "@chakra-ui/react"

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
}

const disabledStyles = {
  _disabled: {
    backgroundColor: "dnd.gold",
    opacity: 0.6,
  },
}

const theme = extendTheme({
  config,
  fonts: {
    heading: "'Cinzel', serif",
    body: "'Inter', sans-serif",
  },
  colors: {
    ui: {
      main: "#8B0000",
      secondary: "#2D1B0E",
      success: "#2E7D32",
      danger: "#B71C1C",
      light: "#F5E6D3",
      dark: "#1A0F0A",
      darkSlate: "#2D1B0E",
      dim: "#8B7355",
    },
    dnd: {
      gold: "#C9A227",
      goldLight: "#E6C84A",
      goldDark: "#9A7B1A",
      crimson: "#8B0000",
      crimsonLight: "#A52A2A",
      parchment: "#F5E6D3",
      parchmentDark: "#E8D4B8",
      leather: "#4A3728",
      leatherLight: "#5D4632",
      ink: "#1A0F0A",
      inkLight: "#1a1a2e",
      bronze: "#CD7F32",
    },
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === "dark" ? "dnd.ink" : "dnd.parchment",
        color: props.colorMode === "dark" ? "dnd.parchment" : "dnd.ink",
      },
    }),
  },
  semanticTokens: {
    colors: {
      "bg.main": {
        default: "dnd.parchment",
        _dark: "dnd.ink",
      },
      "bg.card": {
        default: "white",
        _dark: "rgba(26, 26, 46, 0.7)",
      },
      "bg.cardSolid": {
        default: "dnd.parchmentDark",
        _dark: "rgba(26, 26, 46, 0.9)",
      },
      "bg.subtle": {
        default: "rgba(0, 0, 0, 0.05)",
        _dark: "rgba(0, 0, 0, 0.2)",
      },
      "bg.hover": {
        default: "rgba(201, 162, 39, 0.15)",
        _dark: "rgba(201, 162, 39, 0.1)",
      },
      "border.main": {
        default: "dnd.goldDark",
        _dark: "rgba(201, 162, 39, 0.3)",
      },
      "border.accent": {
        default: "dnd.gold",
        _dark: "dnd.gold",
      },
      "text.primary": {
        default: "dnd.ink",
        _dark: "dnd.parchment",
      },
      "text.secondary": {
        default: "gray.600",
        _dark: "gray.400",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontFamily: "'Cinzel', serif",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "wider",
      },
      variants: {
        primary: {
          backgroundColor: "dnd.gold",
          color: "dnd.ink",
          border: "2px solid",
          borderColor: "dnd.goldDark",
          _hover: {
            backgroundColor: "dnd.goldLight",
            transform: "translateY(-2px)",
            boxShadow: "0 4px 12px rgba(201, 162, 39, 0.4)",
          },
          _disabled: {
            ...disabledStyles,
            _hover: {
              ...disabledStyles,
            },
          },
        },
        danger: {
          backgroundColor: "dnd.crimson",
          color: "dnd.parchment",
          border: "2px solid",
          borderColor: "dnd.crimsonLight",
          _hover: {
            backgroundColor: "dnd.crimsonLight",
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: "dnd.parchment",
            color: "dnd.ink",
            borderColor: "dnd.goldDark",
            borderWidth: "2px",
            _placeholder: {
              color: "dnd.leather",
              opacity: 0.7,
            },
            _hover: {
              borderColor: "dnd.gold",
            },
            _focus: {
              borderColor: "dnd.gold",
              boxShadow: "0 0 0 1px #C9A227",
            },
          },
        },
      },
      defaultProps: {
        variant: "outline",
      },
    },
    FormLabel: {
      baseStyle: {
        fontFamily: "'Cinzel', serif",
        color: "dnd.gold",
      },
    },
    Link: {
      baseStyle: {
        color: "dnd.gold",
        _hover: {
          color: "dnd.goldLight",
          textDecoration: "none",
        },
      },
    },
    Text: {
      baseStyle: {
        color: "dnd.parchment",
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: "'Cinzel', serif",
        color: "dnd.gold",
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            _selected: {
              color: "ui.main",
            },
          },
        },
      },
    },
  },
})

export default theme

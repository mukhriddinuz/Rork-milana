import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

if (Platform.OS === "web" && typeof document !== "undefined") {
  const STYLE_ID = "milana-premium-typography";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.innerHTML = `
      @font-face {
        font-family: 'Futura';
        font-style: normal;
        font-weight: 400;
        src: local('Futura Book'), local('Futura-Book'), local('Futura');
      }
      @font-face {
        font-family: 'Futura';
        font-style: normal;
        font-weight: 500;
        src: local('Futura Medium'), local('Futura-Medium'), local('Futura');
      }
      @font-face {
        font-family: 'Futura';
        font-style: normal;
        font-weight: 700;
        src: local('Futura Bold'), local('Futura-Bold'), local('Futura');
      }
      html, body, #root, #root *, input, textarea, button, select {
        font-family: 'Futura', 'Futura-Medium', 'Futura PT', 'Trebuchet MS', 'Century Gothic', 'Avenir Next', Arial, sans-serif !important;
      }
      html, body {
        font-weight: 400;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
    `;
    document.head.appendChild(style);
  }
}
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { ClientsProvider } from "@/contexts/ClientsContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { WebHeaderProvider } from "@/contexts/WebHeaderContext";
import { HomepageConfigProvider } from "@/contexts/HomepageConfigContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { DepartmentThemeProvider } from "@/contexts/DepartmentThemeContext";
import { LightboxProvider, LightboxOverlay } from "@/contexts/LightboxContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="product-image" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="showroom-admin" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="update-password" options={{ headerShown: false }} />
      <Stack.Screen name="rules" options={{ headerShown: false }} />
      <Stack.Screen name="add-product" options={{ headerShown: false }} />
      <Stack.Screen name="card-lab" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <NetworkProvider>
            <ProductsProvider>
              <CategoriesProvider>
                <ClientsProvider>
                  <CartProvider>
                    <FavoritesProvider>
                      <OrdersProvider>
                        <WebHeaderProvider>
                          <HomepageConfigProvider>
                            <SiteSettingsProvider>
                              <DepartmentThemeProvider>
                                <LightboxProvider>
                                  <RootLayoutNav />
                                  <LightboxOverlay />
                                </LightboxProvider>
                              </DepartmentThemeProvider>
                            </SiteSettingsProvider>
                          </HomepageConfigProvider>
                        </WebHeaderProvider>
                      </OrdersProvider>
                    </FavoritesProvider>
                  </CartProvider>
                </ClientsProvider>
              </CategoriesProvider>
            </ProductsProvider>
          </NetworkProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

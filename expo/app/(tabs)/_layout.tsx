import { Tabs } from "expo-router";
import { ShoppingBag, Grid3x3, Heart, Settings, ClipboardList } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";
import { FontFamily } from "@/constants/typography";

export default function TabLayout() {
  const isWeb = Platform.OS === 'web';
  const { t } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isWeb ? { display: 'none' } : {
          backgroundColor: Colors.white,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 9,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          fontFamily: FontFamily.medium,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('catalog'),
          tabBarIcon: ({ color }) => <Grid3x3 size={20} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('favorites'),
          tabBarIcon: ({ color }) => <Heart size={20} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('cart'),
          tabBarIcon: ({ color }) => <ShoppingBag size={20} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('orders'),
          tabBarIcon: ({ color }) => <ClipboardList size={20} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color }) => <Settings size={20} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

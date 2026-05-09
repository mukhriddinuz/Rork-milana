import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Heart, ShoppingBag, ChevronLeft, Shirt } from 'lucide-react-native';

type Alignment = 'left' | 'center';
type Typography = 'simple' | 'elegant';
type BadgePosition = 'title' | 'corner';
type PricingLayout = 'inline' | 'stacked';
type HoverMode = 'off' | 'on';

interface ToggleOption<T extends string> {
  value: T;
  label: string;
  sublabel: string;
}

interface ControlGroup<T extends string> {
  id: string;
  title: string;
  options: ToggleOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

const BRAND_NAME = 'PIJAMA';
const MODEL_CODE = 'TX-004';
const PRICE = 17;
const OLD_PRICE = 20;
const CATEGORY_FULL = "ERKAKLAR BO'LIMI / UY KIYIMLARI / PIJAMA";

export default function CardLabScreen() {
  const router = useRouter();
  const [alignment, setAlignment] = useState<Alignment>('left');
  const [typography, setTypography] = useState<Typography>('simple');
  const [badge, setBadge] = useState<BadgePosition>('title');
  const [pricing, setPricing] = useState<PricingLayout>('inline');
  const [hover, setHover] = useState<HoverMode>('off');
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const presetPremium = useCallback(() => {
    setAlignment('center');
    setTypography('elegant');
    setBadge('corner');
    setPricing('stacked');
    setHover('on');
  }, []);
  const presetSimple = useCallback(() => {
    setAlignment('left');
    setTypography('simple');
    setBadge('title');
    setPricing('inline');
    setHover('off');
  }, []);

  const groups: [
    ControlGroup<Alignment>,
    ControlGroup<Typography>,
    ControlGroup<BadgePosition>,
    ControlGroup<PricingLayout>,
    ControlGroup<HoverMode>,
  ] = useMemo(
    () => [
      {
        id: 'alignment',
        title: "Matn joylashuvi",
        value: alignment,
        onChange: setAlignment,
        options: [
          { value: 'left', label: 'Chap', sublabel: 'Bizniki' },
          { value: 'center', label: 'Markaz', sublabel: 'Premium' },
        ],
      },
      {
        id: 'typography',
        title: 'Tipografiya',
        value: typography,
        onChange: setTypography,
        options: [
          { value: 'simple', label: 'Sodda', sublabel: 'Bizniki' },
          { value: 'elegant', label: 'Nafis', sublabel: 'Premium' },
        ],
      },
      {
        id: 'badge',
        title: "Yorliq joylashuvi",
        value: badge,
        onChange: setBadge,
        options: [
          { value: 'title', label: 'Sarlavhada', sublabel: 'Bizniki' },
          { value: 'corner', label: 'Burchakda', sublabel: 'Premium' },
        ],
      },
      {
        id: 'pricing',
        title: 'Narx formatlash',
        value: pricing,
        onChange: setPricing,
        options: [
          { value: 'inline', label: "Yonma-yon", sublabel: 'Bizniki' },
          { value: 'stacked', label: 'Markazda', sublabel: 'Premium' },
        ],
      },
      {
        id: 'hover',
        title: "Sichqoncha effekti (Hover)",
        value: hover,
        onChange: setHover,
        options: [
          { value: 'off', label: "O'chir", sublabel: 'Bizniki' },
          { value: 'on', label: 'Yoq', sublabel: 'Premium' },
        ],
      },
    ],
    [alignment, typography, badge, pricing, hover],
  );

  const isAdminStyle = typography === 'simple' && alignment === 'left';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              testID="card-lab-back"
              hitSlop={12}
            >
              <ChevronLeft size={22} color="#111" strokeWidth={1.4} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>INTERAKTIV TAHLIL</Text>
              <Text style={styles.title}>Karta dizayn laboratoriyasi</Text>
              <Text style={styles.subtitle}>
                Har bir tanlov kartani qanday o&apos;zgartirishini ko&apos;ring.
              </Text>
            </View>
          </View>

          <View style={styles.presetRow}>
            <Pressable
              onPress={presetSimple}
              style={[styles.presetBtn, styles.presetBtnGhost]}
              testID="preset-simple"
            >
              <Text style={styles.presetBtnGhostText}>Bizniki</Text>
            </Pressable>
            <Pressable
              onPress={presetPremium}
              style={styles.presetBtn}
              testID="preset-premium"
            >
              <Text style={styles.presetBtnText}>Premium</Text>
            </Pressable>
          </View>

          <View style={styles.controlsWrap}>
            {groups.map((g) => (
              <ControlRow key={g.id} group={g} />
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.resultLabel}>NATIJA</Text>

          <View style={styles.cardStage}>
            <View style={styles.cardOuter} testID="preview-card">
              <PreviewCard
                alignment={alignment}
                typography={typography}
                badge={badge}
                pricing={pricing}
                hover={hover}
                isHovered={isHovered}
                onHoverChange={setIsHovered}
                isAdminStyle={isAdminStyle}
              />
            </View>
          </View>

          <View style={styles.legendBox}>
            <Text style={styles.legendTitle}>Izoh</Text>
            <Text style={styles.legendText}>
              {typography === 'elegant' && alignment === 'center'
                ? "Premium rejim: serif shriftlar, markazlashtirilgan matn, burchakdagi 'YANGI' yorlig'i va hover effekti bilan elegant ko'rinish."
                : "Oddiy rejim: chapga tekislangan matn, administrator tugmasi ('TAHRIRLASH') va rasm o'rnida 'No Image' bloki ko'rsatilgan."}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function ControlRow<T extends string>({ group }: { group: ControlGroup<T> }) {
  return (
    <View style={styles.controlRow}>
      <Text style={styles.controlTitle}>{group.title}</Text>
      <View style={styles.segWrap}>
        {group.options.map((opt) => {
          const active = group.value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => group.onChange(opt.value)}
              style={[styles.segBtn, active && styles.segBtnActive]}
              testID={`ctrl-${group.id}-${opt.value}`}
            >
              <Text style={[styles.segLabel, active && styles.segLabelActive]}>
                {opt.label}
              </Text>
              <Text style={[styles.segSub, active && styles.segSubActive]}>
                ({opt.sublabel})
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface PreviewProps {
  alignment: Alignment;
  typography: Typography;
  badge: BadgePosition;
  pricing: PricingLayout;
  hover: HoverMode;
  isHovered: boolean;
  onHoverChange: (v: boolean) => void;
  isAdminStyle: boolean;
}

function PreviewCard({
  alignment,
  typography,
  badge,
  pricing,
  hover,
  isHovered,
  onHoverChange,
  isAdminStyle,
}: PreviewProps) {
  const isWeb = Platform.OS === 'web';
  const showHoverIcons = hover === 'on' && (isWeb ? isHovered : true);

  const webHoverProps = isWeb
    ? {
        onMouseEnter: () => onHoverChange(true),
        onMouseLeave: () => onHoverChange(false),
      }
    : {};

  const titleText =
    typography === 'elegant' ? BRAND_NAME : `${BRAND_NAME} - ${CATEGORY_FULL}`;

  const titleStyle =
    typography === 'elegant' ? styles.titleElegant : styles.titleSimple;

  const subStyle =
    typography === 'elegant' ? styles.subElegant : styles.subSimple;

  const priceStyle =
    typography === 'elegant' ? styles.priceElegant : styles.priceSimple;

  const alignStyle =
    alignment === 'center' ? styles.alignCenter : styles.alignLeft;

  return (
    <View style={styles.card}>
      <View style={styles.topBar}>
        {badge === 'title' ? (
          <View style={styles.topBadgeInline} testID="badge-title">
            <Text style={styles.topBadgeInlineText}>YANGI MAHSULOT</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>

      <View style={styles.imageWrap} {...webHoverProps} testID="preview-image">
        <View style={styles.imagePlaceholder}>
          {isAdminStyle ? (
            <View style={styles.noImageBlock}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          ) : (
            <LineArtSilhouette />
          )}
        </View>

        {badge === 'corner' && (
          <View style={styles.dogEar} testID="badge-corner">
            <Text style={styles.dogEarText}>YANGI</Text>
          </View>
        )}

        {showHoverIcons && (
          <View style={styles.hoverIcons} testID="hover-icons">
            <View style={styles.hoverIconBtn}>
              <Heart size={16} color="#111" strokeWidth={1.2} />
            </View>
            <View style={styles.hoverIconBtn}>
              <ShoppingBag size={16} color="#111" strokeWidth={1.2} />
            </View>
          </View>
        )}
      </View>

      <View style={[styles.info, alignStyle]}>
        <Text style={[titleStyle, alignStyle]} numberOfLines={2}>
          {titleText}
        </Text>

        {typography === 'elegant' && (
          <Text style={[subStyle, alignStyle]}>{MODEL_CODE}</Text>
        )}

        {pricing === 'inline' ? (
          <View style={styles.priceInlineRow}>
            <Text style={priceStyle}>${PRICE}</Text>
            <Text style={styles.oldPriceInline}>${OLD_PRICE}</Text>
            {typography === 'simple' && (
              <Text style={styles.codeInline}>· {MODEL_CODE}</Text>
            )}
          </View>
        ) : (
          <View style={[styles.priceStackedWrap, alignStyle]}>
            <Text style={[styles.oldPriceStacked, alignStyle]}>
              ${OLD_PRICE}
            </Text>
            <Text style={[priceStyle, alignStyle]}>${PRICE}</Text>
          </View>
        )}

        {isAdminStyle && (
          <Pressable style={styles.adminBtn} testID="admin-edit-btn">
            <Text style={styles.adminBtnText}>TAHRIRLASH</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function LineArtSilhouette() {
  return (
    <View style={styles.silhouetteWrap} testID="line-art">
      <View style={styles.silhouetteFrame}>
        <Shirt size={96} color="#B9B2A7" strokeWidth={0.9} />
        <Text style={styles.silhouetteCaption}>ELEGANT SILUET</Text>
      </View>
    </View>
  );
}

const SERIF = Platform.select({
  ios: 'Futura-Medium',
  android: 'sans-serif-medium',
  default: 'Futura, "Futura-Medium", "Futura PT", "Trebuchet MS", "Century Gothic", "Avenir Next", Arial, sans-serif',
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginTop: 4,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    color: '#8A7F6E',
    fontWeight: '500',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#0F0F0F',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#5C5344',
    lineHeight: 19,
  },

  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  presetBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '500',
  },
  presetBtnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#111111',
  },
  presetBtnGhostText: {
    color: '#111111',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '500',
  },

  controlsWrap: {
    gap: 18,
  },
  controlRow: {
    gap: 8,
  },
  controlTitle: {
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: '#3E362A',
    fontWeight: '600',
  },
  segWrap: {
    flexDirection: 'row',
    backgroundColor: '#EFE9DF',
    padding: 3,
    borderRadius: 2,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  segBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0 1px 2px rgba(0,0,0,0.06)' as unknown as undefined },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  segLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7A6F5D',
    letterSpacing: 0.3,
  },
  segLabelActive: {
    color: '#111111',
  },
  segSub: {
    fontSize: 10,
    color: '#A89C87',
    letterSpacing: 0.3,
  },
  segSubActive: {
    color: '#5C5344',
  },

  divider: {
    height: 1,
    backgroundColor: '#E6DFD3',
    marginVertical: 26,
  },
  resultLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: '#8A7F6E',
    fontWeight: '600',
    marginBottom: 12,
  },

  cardStage: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderWidth: 1,
    borderColor: '#EFE9DF',
    alignItems: 'center',
  },
  cardOuter: {
    width: '100%',
    maxWidth: 320,
  },

  card: {
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    minHeight: 22,
    marginBottom: 8,
  },
  topBadgeInline: {
    backgroundColor: '#E63946',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topBadgeInlineText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  imageWrap: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: '#F3EEE4',
    position: 'relative',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageBlock: {
    width: '72%',
    height: '40%',
    borderWidth: 1,
    borderColor: '#C9C9C9',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECECEC',
  },
  noImageText: {
    color: '#8A8A8A',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  silhouetteWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EEE4',
  },
  silhouetteFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  silhouetteCaption: {
    fontSize: 9,
    letterSpacing: 3,
    color: '#A89C87',
    fontWeight: '500',
  },

  dogEar: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#111111',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dogEarText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: '600',
  },

  hoverIcons: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
  },
  hoverIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  info: {
    paddingTop: 14,
    paddingBottom: 6,
    gap: 4,
  },
  alignLeft: {
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  alignCenter: {
    alignItems: 'center',
    textAlign: 'center',
  },

  titleSimple: {
    fontSize: 12,
    fontWeight: '400',
    color: '#333333',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  titleElegant: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F0F0F',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: SERIF,
  },
  subSimple: {
    fontSize: 11,
    color: '#888',
  },
  subElegant: {
    fontSize: 11,
    color: '#8A7F6E',
    letterSpacing: 1.2,
    marginTop: 2,
  },

  priceInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  priceStackedWrap: {
    marginTop: 6,
    gap: 2,
  },
  priceSimple: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  priceElegant: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F0F0F',
    letterSpacing: 0.6,
    fontFamily: SERIF,
  },
  oldPriceInline: {
    fontSize: 12,
    color: '#B4B4B4',
    textDecorationLine: 'line-through',
  },
  oldPriceStacked: {
    fontSize: 11,
    color: '#B8AE9A',
    textDecorationLine: 'line-through',
    letterSpacing: 0.4,
  },
  codeInline: {
    fontSize: 11,
    color: '#9A9A9A',
  },

  adminBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#2B6CB0',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  adminBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  legendBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F5EFE4',
    borderLeftWidth: 2,
    borderLeftColor: '#0F0F0F',
  },
  legendTitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#3E362A',
    fontWeight: '700',
    marginBottom: 6,
  },
  legendText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#3E362A',
  },
});

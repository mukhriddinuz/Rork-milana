import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  MessageCircle,
  Copy,
  X,
  FileText,
  ChevronRight,
  UserPlus,
  Shield,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientsContext';
import { useOrders } from '@/contexts/OrdersContext';
import EmptyState from '@/components/EmptyState';
import { ClientProfile, ClientStatus, Order } from '@/types';
import useEscapeKey from '@/hooks/useEscapeKey';

export default function ClientsScreen() {
  const { t } = useAuth();
  const { clients, addClientByAccountant, resetClientPassword, updateClientStatus } = useClients();
  const { orders } = useOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [showClientPw, setShowClientPw] = useState(false);
  const [messengerLink, setMessengerLink] = useState('');
  const [newClient, setNewClient] = useState<ClientProfile | null>(null);
  const [newClientStatus, setNewClientStatus] = useState<ClientStatus>('standard');

  const [resetModalClient, setResetModalClient] = useState<ClientProfile | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPw, setShowResetPw] = useState(false);


  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q),
    );
  }, [clients, searchQuery]);

  const getClientOrders = useCallback(
    (clientId: string): Order[] => orders.filter((o) => o.clientId === clientId),
    [orders],
  );

  const getClientTotalSpent = useCallback(
    (clientId: string): number => orders.filter((o) => o.clientId === clientId).reduce((sum, o) => sum + o.total, 0),
    [orders],
  );

  const resetForm = useCallback(() => {
    setFirstName(''); setLastName(''); setLocation(''); setPhone('');
    setClientPassword(''); setShowClientPw(false); setMessengerLink('');
    setNewClient(null); setNewClientStatus('standard');
  }, []);

  const handleAddClient = useCallback(() => {
    if (!firstName.trim() || !lastName.trim() || !location.trim() || !phone.trim() || !clientPassword.trim()) {
      Alert.alert(t('fillAllFields')); return;
    }
    if (clientPassword.length < 4) { Alert.alert(t('passwordTooShort')); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const client = addClientByAccountant({
      firstName: firstName.trim(), lastName: lastName.trim(), location: location.trim(),
      phone: phone.trim(), password: clientPassword,
      messengerLink: messengerLink.trim() || undefined, clientStatus: newClientStatus,
    });
    setNewClient(client);
    console.log('[Clients] Accountant created client:', client.username);
  }, [firstName, lastName, location, phone, clientPassword, messengerLink, addClientByAccountant, t, newClientStatus]);

  const handleResetPassword = useCallback(() => {
    if (!resetModalClient || !resetNewPassword.trim()) { Alert.alert(t('fillAllFields')); return; }
    if (resetNewPassword.length < 4) { Alert.alert(t('passwordTooShort')); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetClientPassword(resetModalClient.id, resetNewPassword);
    Alert.alert('✓', t('passwordReset'));
    setResetModalClient(null); setResetNewPassword(''); setShowResetPw(false);
  }, [resetModalClient, resetNewPassword, resetClientPassword, t]);

  const handleCopyCredentials = useCallback(async (client: ClientProfile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `Login: ${client.username}\nPassword: ${client.password}`;
    await Clipboard.setStringAsync(text);
    Alert.alert('✓', t('credentialsCopied'));
  }, [t]);

  const handleCloseForm = useCallback(() => { setShowAddForm(false); resetForm(); }, [resetForm]);

  const handleCloseReset = useCallback(() => {
    setResetModalClient(null);
    setResetNewPassword('');
    setShowResetPw(false);
  }, []);

  const handleCloseSelected = useCallback(() => setSelectedClient(null), []);

  useEscapeKey(showAddForm, handleCloseForm);
  useEscapeKey(!!selectedClient, handleCloseSelected);
  useEscapeKey(!!resetModalClient, handleCloseReset);

  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  const renderClientCard = useCallback(
    ({ item }: { item: ClientProfile }) => {
      const orderCount = getClientOrders(item.id).length;
      const totalSpent = getClientTotalSpent(item.id);

      return (
        <Pressable
          onPress={() => setSelectedClient(item)}
          style={({ pressed }) => [styles.clientCard, pressed && styles.clientCardPressed]}
        >
          <View style={styles.clientTop}>
            <View style={[styles.clientAvatar, item.clientStatus === 'vip' && styles.clientAvatarVip]}>
              <Text style={styles.clientAvatarText}>
                {item.firstName.charAt(0)}{item.lastName.charAt(0)}
              </Text>
            </View>
            <View style={styles.clientInfo}>
              <View style={styles.clientNameRow}>
                <Text style={styles.clientName} numberOfLines={1}>
                  {item.firstName} {item.lastName}
                </Text>
                {item.clientStatus === 'vip' && (
                  <View style={styles.vipBadge}><Text style={styles.vipBadgeText}>VIP</Text></View>
                )}
              </View>
              <View style={styles.clientMeta}>
                <MapPin size={10} color={Colors.textTertiary} />
                <Text style={styles.clientMetaText} numberOfLines={1}>{item.location}</Text>
              </View>
            </View>
            <ChevronRight size={16} color={Colors.textTertiary} />
          </View>
          <View style={styles.clientBottom}>
            <View style={styles.clientStat}>
              <Text style={styles.clientStatValue}>{orderCount}</Text>
              <Text style={styles.clientStatLabel}>{t('totalOrders')}</Text>
            </View>
            <View style={styles.clientStatDivider} />
            <View style={styles.clientStat}>
              <Text style={styles.clientStatValue}>${totalSpent.toFixed(0)}</Text>
              <Text style={styles.clientStatLabel}>{t('totalSpent')}</Text>
            </View>
            <View style={styles.clientStatDivider} />
            <View style={styles.clientStat}>
              <View style={styles.phoneRow}>
                <Phone size={10} color={Colors.textSecondary} />
                <Text style={styles.clientStatPhone} numberOfLines={1}>{item.phone}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [getClientOrders, getClientTotalSpent, t],
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Search size={14} color={Colors.textTertiary} />
          <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder={t('search')} placeholderTextColor={Colors.textTertiary} />
        </View>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddForm(true); }} style={styles.addBtn} testID="add-client-btn">
          <Plus size={14} color={Colors.white} />
          <Text style={styles.addBtnText}>{t('addClient')}</Text>
        </Pressable>
      </View>

      <View style={styles.countBar}>
        <Text style={styles.countText}>{filteredClients.length} {t('clients').toLowerCase()}</Text>
      </View>

      <FlatList
        data={filteredClients}
        renderItem={renderClientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon={<Users size={48} color={Colors.textTertiary} />} title={t('noClients')} />}
      />

      <Modal visible={showAddForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCloseForm}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{newClient ? t('clientCreated') : t('addClient')}</Text>
              <Pressable onPress={handleCloseForm} style={styles.modalClose}><X size={20} color={Colors.white} /></Pressable>
            </View>

            {newClient ? (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <View style={styles.successSection}>
                  <View style={styles.successIconSmall}><Shield size={24} color={Colors.primary} /></View>
                  <Text style={styles.successTitleSmall}>{t('clientCreated')}</Text>
                  <Text style={styles.clientFullName}>{newClient.firstName} {newClient.lastName}</Text>
                </View>
                <View style={styles.credCard}>
                  <View style={styles.credCardRow}>
                    <Text style={styles.credCardLabel}>{t('username')}</Text>
                    <Text style={styles.credCardValue}>{newClient.username}</Text>
                  </View>
                  <View style={styles.credCardDivider} />
                  <View style={styles.credCardRow}>
                    <Text style={styles.credCardLabel}>{t('password')}</Text>
                    <Text style={styles.credCardValue}>{newClient.password}</Text>
                  </View>
                </View>
                <Pressable onPress={() => handleCopyCredentials(newClient)} style={styles.credCopyBtn}>
                  <Copy size={14} color={Colors.primary} />
                  <Text style={styles.credCopyText}>{t('copyCredentials')}</Text>
                </Pressable>
                <Pressable onPress={handleCloseForm} style={styles.doneBtn}><Text style={styles.doneBtnText}>{t('close')}</Text></Pressable>
              </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('firstName')} *</Text>
                  <TextInput style={styles.formInput} value={firstName} onChangeText={setFirstName} placeholder={t('firstName')} placeholderTextColor={Colors.textTertiary} />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('lastName')} *</Text>
                  <TextInput style={styles.formInput} value={lastName} onChangeText={setLastName} placeholder={t('lastName')} placeholderTextColor={Colors.textTertiary} />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('location')} *</Text>
                  <TextInput style={styles.formInput} value={location} onChangeText={setLocation} placeholder={t('location')} placeholderTextColor={Colors.textTertiary} />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('phone')} *</Text>
                  <TextInput style={styles.formInput} value={phone} onChangeText={setPhone} placeholder="+998 90 123 45 67" placeholderTextColor={Colors.textTertiary} keyboardType="phone-pad" />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('setPassword')} *</Text>
                  <View style={styles.pwFieldRow}>
                    <TextInput style={styles.pwFieldInput} value={clientPassword} onChangeText={setClientPassword} placeholder={t('setPassword')} placeholderTextColor={Colors.textTertiary} secureTextEntry={!showClientPw} autoCapitalize="none" />
                    <Pressable onPress={() => setShowClientPw(!showClientPw)} style={styles.pwFieldEye}>
                      {showClientPw ? <EyeOff size={16} color={Colors.textSecondary} /> : <Eye size={16} color={Colors.textSecondary} />}
                    </Pressable>
                  </View>
                  <Text style={styles.phoneHint}>{t('nameAsLogin')}</Text>
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('messengerLinkOptional')}</Text>
                  <TextInput style={styles.formInput} value={messengerLink} onChangeText={setMessengerLink} placeholder="https://t.me/username" placeholderTextColor={Colors.textTertiary} autoCapitalize="none" />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('clientStatus')}</Text>
                  <View style={styles.statusToggleRow}>
                    <Pressable onPress={() => setNewClientStatus('standard')} style={[styles.statusToggleBtn, newClientStatus === 'standard' && styles.statusToggleBtnActive]}>
                      <Text style={[styles.statusToggleText, newClientStatus === 'standard' && styles.statusToggleTextActive]}>{t('standard')}</Text>
                    </Pressable>
                    <Pressable onPress={() => setNewClientStatus('vip')} style={[styles.statusToggleBtn, newClientStatus === 'vip' && styles.statusToggleBtnVip]}>
                      <Text style={[styles.statusToggleText, newClientStatus === 'vip' && styles.statusToggleTextActive]}>VIP</Text>
                    </Pressable>
                  </View>
                </View>
                <Pressable onPress={handleAddClient} style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}>
                  <UserPlus size={16} color={Colors.white} />
                  <Text style={styles.submitBtnText}>{t('addClient')}</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!selectedClient} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedClient(null)}>
        {selectedClient && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('clientDetails')}</Text>
              <Pressable onPress={() => setSelectedClient(null)} style={styles.modalClose}><X size={20} color={Colors.white} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.detailSection}>
                <View style={styles.detailAvatar}><Text style={styles.detailAvatarText}>{selectedClient.firstName.charAt(0)}{selectedClient.lastName.charAt(0)}</Text></View>
                <Text style={styles.detailName}>{selectedClient.firstName} {selectedClient.lastName}</Text>
              </View>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}><MapPin size={14} color={Colors.textSecondary} /><Text style={styles.detailLabel}>{t('location')}</Text><Text style={styles.detailValue}>{selectedClient.location}</Text></View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}><Phone size={14} color={Colors.textSecondary} /><Text style={styles.detailLabel}>{t('phone')}</Text><Text style={styles.detailValue}>{selectedClient.phone}</Text></View>
                {selectedClient.messengerLink ? (<><View style={styles.detailDivider} /><View style={styles.detailRow}><MessageCircle size={14} color={Colors.textSecondary} /><Text style={styles.detailLabel}>{t('messengerLink')}</Text><Text style={styles.detailValue} numberOfLines={1}>{selectedClient.messengerLink}</Text></View></>) : null}
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}><FileText size={14} color={Colors.textSecondary} /><Text style={styles.detailLabel}>{t('createdDate')}</Text><Text style={styles.detailValue}>{formatDate(selectedClient.createdAt)}</Text></View>
              </View>
              <Text style={styles.detailSectionTitle}>{t('loginInfo')}</Text>
              <View style={styles.credCard}>
                <View style={styles.credCardRow}><Text style={styles.credCardLabel}>{t('username')}</Text><Text style={styles.credCardValue}>{selectedClient.username}</Text></View>
                <View style={styles.credCardDivider} />
                <View style={styles.credCardRow}><Text style={styles.credCardLabel}>{t('password')}</Text><Text style={styles.credCardValue}>{selectedClient.password}</Text></View>
              </View>
              <Text style={styles.detailSectionTitle}>{t('clientStatus')}</Text>
              <View style={styles.statusToggleRow}>
                <Pressable onPress={() => { Haptics.selectionAsync(); updateClientStatus(selectedClient.id, 'standard'); setSelectedClient({ ...selectedClient, clientStatus: 'standard' }); }} style={[styles.statusToggleBtn, selectedClient.clientStatus !== 'vip' && styles.statusToggleBtnActive]}>
                  <Text style={[styles.statusToggleText, selectedClient.clientStatus !== 'vip' && styles.statusToggleTextActive]}>{t('standard')}</Text>
                </Pressable>
                <Pressable onPress={() => { Haptics.selectionAsync(); updateClientStatus(selectedClient.id, 'vip'); setSelectedClient({ ...selectedClient, clientStatus: 'vip' }); }} style={[styles.statusToggleBtn, selectedClient.clientStatus === 'vip' && styles.statusToggleBtnVip]}>
                  <Text style={[styles.statusToggleText, selectedClient.clientStatus === 'vip' && styles.statusToggleTextActive]}>VIP</Text>
                </Pressable>
              </View>
              <View style={styles.credActionsRow}>
                <Pressable onPress={() => handleCopyCredentials(selectedClient)} style={[styles.credCopyBtn, { flex: 1 }]}>
                  <Copy size={14} color={Colors.primary} /><Text style={styles.credCopyText}>{t('copyCredentials')}</Text>
                </Pressable>
                <Pressable onPress={() => { setResetModalClient(selectedClient); setResetNewPassword(''); setShowResetPw(false); }} style={styles.resetPwBtn} testID="reset-password-btn">
                  <RotateCcw size={14} color={Colors.white} /><Text style={styles.resetPwBtnText}>{t('resetPassword')}</Text>
                </Pressable>
              </View>
              <Text style={styles.detailSectionTitle}>{t('orderHistory')}</Text>
              <View style={styles.orderStatsRow}>
                <View style={styles.orderStatBox}><Text style={styles.orderStatNum}>{getClientOrders(selectedClient.id).length}</Text><Text style={styles.orderStatLabel}>{t('totalOrders')}</Text></View>
                <View style={styles.orderStatBox}><Text style={styles.orderStatNum}>${getClientTotalSpent(selectedClient.id).toFixed(2)}</Text><Text style={styles.orderStatLabel}>{t('totalSpent')}</Text></View>
              </View>
              {getClientOrders(selectedClient.id).map((order) => (
                <View key={order.id} style={styles.orderMiniCard}>
                  <View style={styles.orderMiniTop}><Text style={styles.orderMiniId}>#{order.id.slice(-6)}</Text><View style={styles.orderMiniBadge}><Text style={styles.orderMiniBadgeText}>{t(order.status)}</Text></View></View>
                  <View style={styles.orderMiniBottom}><Text style={styles.orderMiniDate}>{formatDate(order.createdAt)}</Text><Text style={styles.orderMiniTotal}>${order.total.toFixed(2)}</Text></View>
                  <Text style={styles.orderMiniItems}>{order.items.length} {t('items')}</Text>
                </View>
              ))}
              {getClientOrders(selectedClient.id).length === 0 && (<View style={styles.noOrdersBox}><Text style={styles.noOrdersText}>{t('noOrders')}</Text></View>)}
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal visible={!!resetModalClient} animationType="fade" transparent onRequestClose={() => setResetModalClient(null)}>
        <View style={styles.resetOverlay}>
          <View style={styles.resetCard}>
            <View style={styles.resetHeader}><Lock size={20} color={Colors.primary} /><Text style={styles.resetTitle}>{t('resetPassword')}</Text></View>
            {resetModalClient && (<Text style={styles.resetClientName}>{t('resetPasswordFor')} {resetModalClient.firstName} {resetModalClient.lastName}</Text>)}
            <View style={styles.resetField}>
              <Text style={styles.resetFieldLabel}>{t('newTempPassword')}</Text>
              <View style={styles.pwFieldRow}>
                <TextInput style={styles.pwFieldInput} value={resetNewPassword} onChangeText={setResetNewPassword} placeholder={t('newTempPassword')} placeholderTextColor={Colors.textTertiary} secureTextEntry={!showResetPw} autoCapitalize="none" testID="reset-password-input" />
                <Pressable onPress={() => setShowResetPw(!showResetPw)} style={styles.pwFieldEye}>
                  {showResetPw ? <EyeOff size={16} color={Colors.textSecondary} /> : <Eye size={16} color={Colors.textSecondary} />}
                </Pressable>
              </View>
            </View>
            <View style={styles.resetActions}>
              <Pressable onPress={() => { setResetModalClient(null); setResetNewPassword(''); setShowResetPw(false); }} style={styles.resetCancelBtn}><Text style={styles.resetCancelText}>{t('cancel')}</Text></Pressable>
              <Pressable onPress={handleResetPassword} style={styles.resetConfirmBtn} testID="confirm-reset-btn"><Check size={14} color={Colors.white} /><Text style={styles.resetConfirmText}>{t('save')}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12, height: 40, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: Colors.text, padding: 0 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.primary },
  addBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.white },
  countBar: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.background },
  countText: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500' as const },
  listContent: { padding: 12, paddingBottom: 30 },
  clientCard: { backgroundColor: Colors.white, borderRadius: 10, padding: 12, marginBottom: 8, shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  clientCardPressed: { backgroundColor: Colors.background },
  clientTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  clientAvatarVip: { borderWidth: 2, borderColor: '#FFD700' },
  clientAvatarText: { fontSize: 13, fontWeight: '700' as const, color: Colors.white },
  clientInfo: { flex: 1 },
  clientNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clientName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  clientMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  clientMetaText: { fontSize: 11, color: Colors.textTertiary },
  clientBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  clientStat: { flex: 1, alignItems: 'center' },
  clientStatValue: { fontSize: 13, fontWeight: '700' as const, color: Colors.text },
  clientStatLabel: { fontSize: 9, color: Colors.textTertiary, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
  clientStatDivider: { width: 1, height: 24, backgroundColor: Colors.borderLight },
  clientStatPhone: { fontSize: 11, color: Colors.textSecondary },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  vipBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.primary },
  vipBadgeText: { fontSize: 8, fontWeight: '800' as const, color: Colors.white, letterSpacing: 0.5 },
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, backgroundColor: Colors.primary },
  modalTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.white },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 16, paddingBottom: 40, gap: 12 },
  formField: { gap: 5 },
  formLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  formInput: { height: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, fontSize: 14, color: Colors.text, backgroundColor: Colors.background },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 10, backgroundColor: Colors.primary, marginTop: 4 },
  submitBtnPressed: { backgroundColor: Colors.primaryDark },
  submitBtnText: { fontSize: 15, fontWeight: '600' as const, color: Colors.white },
  successSection: { alignItems: 'center', marginBottom: 8 },
  successIconSmall: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  successTitleSmall: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  clientFullName: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  credCard: { backgroundColor: Colors.background, borderRadius: 10, overflow: 'hidden' },
  credCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  credCardDivider: { height: 1, backgroundColor: Colors.border },
  credCardLabel: { fontSize: 11, fontWeight: '500' as const, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  credCardValue: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  credCopyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.primaryLight },
  credCopyText: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary },
  doneBtn: { height: 50, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  doneBtnText: { fontSize: 15, fontWeight: '600' as const, color: Colors.white },
  detailSection: { alignItems: 'center', marginBottom: 4 },
  detailAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  detailAvatarText: { fontSize: 20, fontWeight: '700' as const, color: Colors.white },
  detailName: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  detailCard: { backgroundColor: Colors.background, borderRadius: 10, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  detailDivider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 36 },
  detailLabel: { fontSize: 12, color: Colors.textSecondary, width: 70 },
  detailValue: { flex: 1, fontSize: 13, fontWeight: '500' as const, color: Colors.text, textAlign: 'right' as const },
  detailSectionTitle: { fontSize: 10, fontWeight: '600' as const, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  statusToggleRow: { flexDirection: 'row', gap: 8 },
  statusToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center' },
  statusToggleBtnActive: { backgroundColor: Colors.text },
  statusToggleBtnVip: { backgroundColor: Colors.primary },
  statusToggleText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  statusToggleTextActive: { color: Colors.white },
  credActionsRow: { flexDirection: 'row', gap: 8 },
  resetPwBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.text },
  resetPwBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.white },
  orderStatsRow: { flexDirection: 'row', gap: 8 },
  orderStatBox: { flex: 1, backgroundColor: Colors.background, borderRadius: 10, padding: 14, alignItems: 'center' },
  orderStatNum: { fontSize: 18, fontWeight: '800' as const, color: Colors.text },
  orderStatLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  orderMiniCard: { backgroundColor: Colors.background, borderRadius: 10, padding: 12 },
  orderMiniTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderMiniId: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  orderMiniBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: Colors.statusPendingLight },
  orderMiniBadgeText: { fontSize: 10, fontWeight: '600' as const, color: Colors.statusPending },
  orderMiniBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  orderMiniDate: { fontSize: 11, color: Colors.textTertiary },
  orderMiniTotal: { fontSize: 15, fontWeight: '800' as const, color: Colors.text },
  orderMiniItems: { fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
  noOrdersBox: { backgroundColor: Colors.background, borderRadius: 10, padding: 20, alignItems: 'center' },
  noOrdersText: { fontSize: 13, color: Colors.textTertiary },
  pwFieldRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, backgroundColor: Colors.background, overflow: 'hidden' },
  pwFieldInput: { flex: 1, height: 46, paddingHorizontal: 14, fontSize: 14, color: Colors.text },
  pwFieldEye: { paddingHorizontal: 14, height: 46, alignItems: 'center', justifyContent: 'center' },
  phoneHint: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const, marginTop: 4 },
  resetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  resetCard: { width: '100%', maxWidth: 380, backgroundColor: Colors.white, borderRadius: 14, padding: 20, gap: 14 },
  resetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resetTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  resetClientName: { fontSize: 13, color: Colors.textSecondary },
  resetField: { gap: 5 },
  resetFieldLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  resetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  resetCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: Colors.background },
  resetCancelText: { fontSize: 13, fontWeight: '500' as const, color: Colors.textSecondary },
  resetConfirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: Colors.primary },
  resetConfirmText: { fontSize: 13, fontWeight: '600' as const, color: Colors.white },
});

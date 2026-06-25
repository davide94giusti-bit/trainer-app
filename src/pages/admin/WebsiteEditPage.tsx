import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import { useMutation, useQuery } from '@tanstack/react-query';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import LocalizedJsonEditor from '../../components/admin/LocalizedJsonEditor';
import LoadingScreen from '../../components/LoadingScreen';
import {
  defaultBranding,
  getBrandingSettings,
  listContentBlocks,
  listDashboardWidgets,
  listFeatureFlags,
  listNavigationItems,
  listPolicySettings,
  saveContentBlock,
  saveDashboardWidgets,
  saveFeatureFlag,
  saveNavigationItems,
  savePolicySetting,
  updateBrandingSettings,
  type BrandingSettings,
  type ContentBlock,
  type DashboardWidget,
  type FeatureFlag,
  type NavigationItem,
  type PolicySetting,
} from '../../services/appBuilder.service';
import { queryClient } from '../../lib/queryClient';
import { useI18n } from '../../lib/i18n';
import type { Language } from '../../types/domain';

type EditorTarget =
  | { type: 'branding'; key: 'brand' | 'login' | 'colors' }
  | { type: 'content'; key: string }
  | { type: 'widget'; key: string }
  | { type: 'navigation'; key: string }
  | { type: 'feature'; key: string }
  | { type: 'policy'; key: string };

const initialTarget: EditorTarget = { type: 'branding', key: 'brand' };

function localizedValue(value: Record<string, string> | undefined, lang: Language) {
  return value?.[lang] || value?.en || value?.es || value?.it || '';
}

function isSelected(target: EditorTarget, type: EditorTarget['type'], key: string) {
  return target.type === type && target.key === key;
}

export default function WebsiteEditPage() {
  const { t, language } = useI18n();
  const [editorLang, setEditorLang] = React.useState<Language>((language as Language) || 'en');
  const [device, setDevice] = React.useState<'mobile' | 'desktop'>('desktop');
  const [editMode, setEditMode] = React.useState(true);
  const [target, setTarget] = React.useState<EditorTarget>(initialTarget);

  const brandingQuery = useQuery({ queryKey: ['app-branding'], queryFn: getBrandingSettings });
  const contentQuery = useQuery({ queryKey: ['app-content-blocks'], queryFn: listContentBlocks });
  const widgetsQuery = useQuery({ queryKey: ['app-dashboard-widgets'], queryFn: listDashboardWidgets });
  const navigationQuery = useQuery({ queryKey: ['app-navigation-items'], queryFn: listNavigationItems });
  const featuresQuery = useQuery({ queryKey: ['app-feature-flags'], queryFn: listFeatureFlags });
  const policiesQuery = useQuery({ queryKey: ['app-policy-settings'], queryFn: listPolicySettings });

  const brandingMutation = useMutation({ mutationFn: updateBrandingSettings, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-branding'] }) });
  const contentMutation = useMutation({ mutationFn: saveContentBlock, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-content-blocks'] }) });
  const widgetsMutation = useMutation({ mutationFn: saveDashboardWidgets, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-dashboard-widgets'] }) });
  const navigationMutation = useMutation({ mutationFn: saveNavigationItems, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-navigation-items'] }) });
  const featureMutation = useMutation({ mutationFn: saveFeatureFlag, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-feature-flags'] }) });
  const policyMutation = useMutation({ mutationFn: savePolicySetting, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-policy-settings'] }) });

  const isLoading = brandingQuery.isLoading || contentQuery.isLoading || widgetsQuery.isLoading || navigationQuery.isLoading || featuresQuery.isLoading || policiesQuery.isLoading;
  const error = brandingQuery.error || contentQuery.error || widgetsQuery.error || navigationQuery.error || featuresQuery.error || policiesQuery.error || brandingMutation.error || contentMutation.error || widgetsMutation.error || navigationMutation.error || featureMutation.error || policyMutation.error;
  const success = brandingMutation.isSuccess || contentMutation.isSuccess || widgetsMutation.isSuccess || navigationMutation.isSuccess || featureMutation.isSuccess || policyMutation.isSuccess;

  if (isLoading) return <LoadingScreen />;

  const branding = brandingQuery.data ?? defaultBranding;
  const content = contentQuery.data ?? [];
  const widgets = widgetsQuery.data ?? [];
  const navigation = navigationQuery.data ?? [];
  const features = featuresQuery.data ?? [];
  const policies = policiesQuery.data ?? [];

  return <Stack spacing={2}>
    <AdminPageHeader title={t('websiteEdit.title')} subtitle={t('websiteEdit.subtitle')} />
    {error && <Alert severity="error">{(error as Error).message}</Alert>}
    {success && <Alert severity="success">{t('websiteEdit.saved')}</Alert>}

    <Card>
      <CardContent>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip icon={<TouchAppIcon />} color={editMode ? 'primary' : 'default'} label={editMode ? t('websiteEdit.editModeOn') : t('websiteEdit.editModeOff')} onClick={() => setEditMode(current => !current)} />
            <TextField select size="small" label={t('websiteEdit.language')} value={editorLang} onChange={event => setEditorLang(event.target.value as Language)} sx={{ minWidth: 150 }}>
              <MenuItem value="en">{t('appBuilder.english')}</MenuItem>
              <MenuItem value="es">{t('appBuilder.spanish')}</MenuItem>
              <MenuItem value="it">{t('appBuilder.italian')}</MenuItem>
            </TextField>
          </Stack>
          <ToggleButtonGroup exclusive size="small" value={device} onChange={(_, value) => value && setDevice(value)}>
            <ToggleButton value="desktop"><DesktopWindowsIcon fontSize="small" sx={{ mr: 1 }} />{t('websiteEdit.desktop')}</ToggleButton>
            <ToggleButton value="mobile"><SmartphoneIcon fontSize="small" sx={{ mr: 1 }} />{t('websiteEdit.mobile')}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </CardContent>
    </Card>

    <Grid container spacing={2} alignItems="flex-start">
      <Grid item xs={12} lg={8}>
        <VisualWebsitePreview
          branding={branding}
          content={content}
          widgets={widgets}
          navigation={navigation}
          features={features}
          policies={policies}
          lang={editorLang}
          device={device}
          editMode={editMode}
          target={target}
          onSelect={setTarget}
        />
      </Grid>
      <Grid item xs={12} lg={4}>
        <EditorInspector
          target={target}
          branding={branding}
          content={content}
          widgets={widgets}
          navigation={navigation}
          features={features}
          policies={policies}
          onSaveBranding={brandingMutation.mutate}
          onSaveContent={contentMutation.mutate}
          onSaveWidgets={widgetsMutation.mutate}
          onSaveNavigation={navigationMutation.mutate}
          onSaveFeature={featureMutation.mutate}
          onSavePolicy={policyMutation.mutate}
          saving={brandingMutation.isPending || contentMutation.isPending || widgetsMutation.isPending || navigationMutation.isPending || featureMutation.isPending || policyMutation.isPending}
        />
      </Grid>
    </Grid>
  </Stack>;
}

function VisualWebsitePreview({ branding, content, widgets, navigation, features, policies, lang, device, editMode, target, onSelect }: {
  branding: BrandingSettings;
  content: ContentBlock[];
  widgets: DashboardWidget[];
  navigation: NavigationItem[];
  features: FeatureFlag[];
  policies: PolicySetting[];
  lang: Language;
  device: 'mobile' | 'desktop';
  editMode: boolean;
  target: EditorTarget;
  onSelect: (target: EditorTarget) => void;
}) {
  const { t } = useI18n();
  const contentByKey = Object.fromEntries(content.map(block => [block.key, block]));
  const maxWidth = device === 'mobile' ? 390 : '100%';
  const visibleWidgets = [...widgets].sort((a, b) => a.sort_order - b.sort_order).filter(widget => widget.enabled).slice(0, device === 'mobile' ? 4 : 8);
  const visibleNavigation = [...navigation].sort((a, b) => a.sort_order - b.sort_order).filter(item => item.enabled);
  const sharedDiscount = policies.find(policy => policy.key === 'shared_session_discount_percent')?.value ?? 40;

  return <Paper variant="outlined" sx={{ p: { xs: 1, md: 2 }, bgcolor: 'grey.50' }}>
    <Box sx={{ mx: 'auto', maxWidth, transition: 'max-width .2s ease' }}>
      <Stack spacing={2}>
        <PreviewEditableFrame active={isSelected(target, 'branding', 'brand')} editMode={editMode} label={t('websiteEdit.brandingFrame')} onClick={() => onSelect({ type: 'branding', key: 'brand' })}>
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 3, color: '#fff', background: `linear-gradient(135deg, ${branding.primary_color || '#1976d2'}, ${branding.secondary_color || '#9c27b0'})` }}>
              <Stack spacing={1.5}>
                {branding.logo_url && <Box component="img" src={branding.logo_url} alt={branding.app_name} sx={{ maxHeight: 48, maxWidth: 180, objectFit: 'contain' }} />}
                <Typography variant={device === 'mobile' ? 'h5' : 'h3'} fontWeight={800}>{branding.app_name || 'Trainer App'}</Typography>
                <Typography>{branding.trainer_display_name || branding.business_name || t('websiteEdit.customerExperience')}</Typography>
              </Stack>
            </Box>
          </Card>
        </PreviewEditableFrame>

        <PreviewEditableFrame active={isSelected(target, 'content', 'dashboard_welcome')} editMode={editMode} label={t('websiteEdit.contentFrame')} onClick={() => onSelect({ type: 'content', key: 'dashboard_welcome' })}>
          <Card><CardContent><Stack spacing={1}><Typography variant="h5">{localizedValue(contentByKey.dashboard_welcome?.localized_value, lang) || t('dashboard.welcome')}</Typography><Typography color="text.secondary">{localizedValue(contentByKey.support_help?.localized_value, lang) || t('websiteEdit.supportPreview')}</Typography></Stack></CardContent></Card>
        </PreviewEditableFrame>

        <Grid container spacing={1.5}>
          {visibleWidgets.map(widget => <Grid item xs={12} sm={device === 'mobile' ? 12 : 6} key={widget.key}>
            <PreviewEditableFrame active={isSelected(target, 'widget', widget.key)} editMode={editMode} label={t('websiteEdit.widgetFrame')} onClick={() => onSelect({ type: 'widget', key: widget.key })}>
              <Card><CardContent><Typography variant="overline" color="text.secondary">{t('websiteEdit.dashboardWidget')}</Typography><Typography variant="h6">{widget.label}</Typography><Typography color="text.secondary">{t('websiteEdit.widgetPreview')}</Typography></CardContent></Card>
            </PreviewEditableFrame>
          </Grid>)}
        </Grid>

        <PreviewEditableFrame active={isSelected(target, 'navigation', visibleNavigation[0]?.key ?? 'dashboard')} editMode={editMode} label={t('websiteEdit.navigationFrame')} onClick={() => onSelect({ type: 'navigation', key: visibleNavigation[0]?.key ?? 'dashboard' })}>
          <Card><CardContent><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>{visibleNavigation.map(item => <Chip key={item.key} label={item.label} onClick={editMode ? () => onSelect({ type: 'navigation', key: item.key }) : undefined} />)}</Stack></CardContent></Card>
        </PreviewEditableFrame>

        <Grid container spacing={1.5}>
          {features.slice(0, 4).map(flag => <Grid item xs={12} sm={6} key={flag.key}>
            <PreviewEditableFrame active={isSelected(target, 'feature', flag.key)} editMode={editMode} label={t('websiteEdit.featureFrame')} onClick={() => onSelect({ type: 'feature', key: flag.key })}>
              <Card><CardContent><Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between"><Typography>{flag.label}</Typography><Chip size="small" color={flag.enabled ? 'success' : 'default'} label={flag.enabled ? t('common.enabled') : t('common.disabled')} /></Stack></CardContent></Card>
            </PreviewEditableFrame>
          </Grid>)}
        </Grid>

        <PreviewEditableFrame active={isSelected(target, 'policy', 'shared_session_discount_percent')} editMode={editMode} label={t('websiteEdit.policyFrame')} onClick={() => onSelect({ type: 'policy', key: 'shared_session_discount_percent' })}>
          <Card><CardContent><Typography variant="h6">{t('availability.requestSharedSession')}</Typography><Typography color="text.secondary">{t('availability.sharedDiscountNotice', { percent: Number(sharedDiscount) || 40 })}</Typography></CardContent></Card>
        </PreviewEditableFrame>
      </Stack>
    </Box>
  </Paper>;
}

function PreviewEditableFrame({ active, editMode, label, onClick, children }: { active: boolean; editMode: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  if (!editMode) return <>{children}</>;
  return <Box sx={{ position: 'relative', outline: active ? '3px solid' : '1px dashed', outlineColor: active ? 'primary.main' : 'primary.light', borderRadius: 2 }}>
    <Chip size="small" color={active ? 'primary' : 'default'} label={label} sx={{ position: 'absolute', top: -12, left: 12, zIndex: 2 }} />
    <CardActionArea onClick={onClick} sx={{ borderRadius: 2 }}>{children}</CardActionArea>
  </Box>;
}

function EditorInspector({ target, branding, content, widgets, navigation, features, policies, onSaveBranding, onSaveContent, onSaveWidgets, onSaveNavigation, onSaveFeature, onSavePolicy, saving }: {
  target: EditorTarget;
  branding: BrandingSettings;
  content: ContentBlock[];
  widgets: DashboardWidget[];
  navigation: NavigationItem[];
  features: FeatureFlag[];
  policies: PolicySetting[];
  onSaveBranding: (branding: BrandingSettings) => void;
  onSaveContent: (content: ContentBlock) => void;
  onSaveWidgets: (widgets: DashboardWidget[]) => void;
  onSaveNavigation: (navigation: NavigationItem[]) => void;
  onSaveFeature: (flag: FeatureFlag) => void;
  onSavePolicy: (policy: PolicySetting) => void;
  saving: boolean;
}) {
  const { t } = useI18n();
  const [brandingDraft, setBrandingDraft] = React.useState(branding);
  const [contentDraft, setContentDraft] = React.useState<ContentBlock | null>(null);
  const [widgetDraft, setWidgetDraft] = React.useState<DashboardWidget | null>(null);
  const [navDraft, setNavDraft] = React.useState<NavigationItem | null>(null);
  const [featureDraft, setFeatureDraft] = React.useState<FeatureFlag | null>(null);
  const [policyDraft, setPolicyDraft] = React.useState<PolicySetting | null>(null);

  React.useEffect(() => setBrandingDraft(branding), [branding]);
  React.useEffect(() => setContentDraft(target.type === 'content' ? content.find(item => item.key === target.key) ?? null : null), [target, content]);
  React.useEffect(() => setWidgetDraft(target.type === 'widget' ? widgets.find(item => item.key === target.key) ?? null : null), [target, widgets]);
  React.useEffect(() => setNavDraft(target.type === 'navigation' ? navigation.find(item => item.key === target.key) ?? null : null), [target, navigation]);
  React.useEffect(() => setFeatureDraft(target.type === 'feature' ? features.find(item => item.key === target.key) ?? null : null), [target, features]);
  React.useEffect(() => setPolicyDraft(target.type === 'policy' ? policies.find(item => item.key === target.key) ?? null : null), [target, policies]);

  return <Card sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
    <CardContent>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6">{t('websiteEdit.inspector')}</Typography>
          <Typography color="text.secondary">{t('websiteEdit.inspectorHelp')}</Typography>
        </Box>
        <Divider />

        {target.type === 'branding' && <Stack spacing={2}>
          <Typography variant="subtitle2">{target.key === 'colors' ? t('websiteEdit.colors') : target.key === 'login' ? t('websiteEdit.loginCopy') : t('websiteEdit.branding')}</Typography>
          <TextField label={t('appBuilder.appName')} value={brandingDraft.app_name} onChange={e => setBrandingDraft({ ...brandingDraft, app_name: e.target.value })} />
          <TextField label={t('appBuilder.logoUrl')} value={brandingDraft.logo_url} onChange={e => setBrandingDraft({ ...brandingDraft, logo_url: e.target.value })} />
          <TextField label={t('appBuilder.trainerDisplayName')} value={brandingDraft.trainer_display_name} onChange={e => setBrandingDraft({ ...brandingDraft, trainer_display_name: e.target.value })} />
          <Stack direction="row" spacing={1}>
            <TextField fullWidth label={t('appBuilder.primaryColor')} value={brandingDraft.primary_color} onChange={e => setBrandingDraft({ ...brandingDraft, primary_color: e.target.value })} />
            <TextField fullWidth label={t('appBuilder.secondaryColor')} value={brandingDraft.secondary_color} onChange={e => setBrandingDraft({ ...brandingDraft, secondary_color: e.target.value })} />
          </Stack>
          <Typography variant="subtitle2">{t('appBuilder.loginTitle')}</Typography>
          <LocalizedJsonEditor value={brandingDraft.login_title} onChange={login_title => setBrandingDraft({ ...brandingDraft, login_title })} />
          <Typography variant="subtitle2">{t('appBuilder.loginSubtitle')}</Typography>
          <LocalizedJsonEditor value={brandingDraft.login_subtitle} onChange={login_subtitle => setBrandingDraft({ ...brandingDraft, login_subtitle })} />
          <Button variant="contained" disabled={saving} onClick={() => onSaveBranding(brandingDraft)}>{t('common.save')}</Button>
        </Stack>}

        {target.type === 'content' && contentDraft && <Stack spacing={2}>
          <Typography variant="subtitle2">{contentDraft.label}</Typography>
          <LocalizedJsonEditor value={contentDraft.localized_value} onChange={localized_value => setContentDraft({ ...contentDraft, localized_value })} />
          <FormControlLabel control={<Switch checked={contentDraft.enabled} onChange={e => setContentDraft({ ...contentDraft, enabled: e.target.checked })} />} label={contentDraft.enabled ? t('common.enabled') : t('common.disabled')} />
          <Button variant="contained" disabled={saving} onClick={() => onSaveContent(contentDraft)}>{t('common.save')}</Button>
        </Stack>}

        {target.type === 'widget' && widgetDraft && <Stack spacing={2}>
          <TextField label={t('common.label')} value={widgetDraft.label} onChange={e => setWidgetDraft({ ...widgetDraft, label: e.target.value })} />
          <TextField type="number" label={t('websiteEdit.sortOrder')} value={widgetDraft.sort_order} onChange={e => setWidgetDraft({ ...widgetDraft, sort_order: Number(e.target.value) })} />
          <FormControlLabel control={<Switch checked={widgetDraft.enabled} onChange={e => setWidgetDraft({ ...widgetDraft, enabled: e.target.checked })} />} label={widgetDraft.enabled ? t('common.enabled') : t('common.disabled')} />
          <Button variant="contained" disabled={saving} onClick={() => onSaveWidgets(widgets.map(item => item.key === widgetDraft.key ? widgetDraft : item))}>{t('common.save')}</Button>
        </Stack>}

        {target.type === 'navigation' && navDraft && <Stack spacing={2}>
          <TextField label={t('common.label')} value={navDraft.label} onChange={e => setNavDraft({ ...navDraft, label: e.target.value })} />
          <TextField label={t('websiteEdit.route')} value={navDraft.route} disabled />
          <TextField type="number" label={t('websiteEdit.sortOrder')} value={navDraft.sort_order} onChange={e => setNavDraft({ ...navDraft, sort_order: Number(e.target.value) })} />
          <FormControlLabel control={<Switch checked={navDraft.enabled} onChange={e => setNavDraft({ ...navDraft, enabled: e.target.checked })} />} label={navDraft.enabled ? t('common.enabled') : t('common.disabled')} />
          <Button variant="contained" disabled={saving} onClick={() => onSaveNavigation(navigation.map(item => item.key === navDraft.key ? navDraft : item))}>{t('common.save')}</Button>
        </Stack>}

        {target.type === 'feature' && featureDraft && <Stack spacing={2}>
          <Typography variant="subtitle2">{featureDraft.label}</Typography>
          <FormControlLabel control={<Switch checked={featureDraft.enabled} onChange={e => setFeatureDraft({ ...featureDraft, enabled: e.target.checked })} />} label={featureDraft.enabled ? t('common.enabled') : t('common.disabled')} />
          <Button variant="contained" disabled={saving} onClick={() => onSaveFeature(featureDraft)}>{t('common.save')}</Button>
        </Stack>}

        {target.type === 'policy' && policyDraft && <Stack spacing={2}>
          <Typography variant="subtitle2">{policyDraft.label}</Typography>
          <TextField label={t('common.value')} value={String(policyDraft.value)} onChange={e => setPolicyDraft({ ...policyDraft, value: e.target.value })} />
          <Button variant="contained" disabled={saving} onClick={() => onSavePolicy(policyDraft)}>{t('common.save')}</Button>
        </Stack>}
      </Stack>
    </CardContent>
  </Card>;
}

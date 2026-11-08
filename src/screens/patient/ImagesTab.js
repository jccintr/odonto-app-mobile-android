import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon } from 'lucide-react-native';
import { Images } from '../../api';
import { errorMessage } from '../../api/client';
import { Alert, Body, Button, Card, Chip, EmptyState, ErrorState, Input, Label, Loading, Muted, Row, Sheet } from '../../components/ui';
import { useResource } from '../../hooks';
import { dayOf, formatDay } from '../../lib/dates';
import { IMAGE_KIND } from '../../lib/labels';
import { fileFromPicker, uploadPatientImage } from '../../lib/upload';
import { isTooth } from '../../lib/tooth';

const PICKER = { mediaTypes: ['images'], quality: 0.85 };

export default function ImagesTab({ patient }) {
  const res = useResource(() => Images.list(patient.id, { perPage: 50 }), [patient.id]);
  const [file, setFile] = useState(null); // imagem escolhida, esperando os dados antes de enviar
  const [meta, setMeta] = useState({ kind: 'xray', tooth: '', notes: '' });
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const pick = async (camera) => {
    setError(null); setMessage(null);
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError(camera ? 'Sem permissão para usar a câmera. Libere nas configurações do aparelho.' : 'Sem permissão para acessar as fotos. Libere nas configurações do aparelho.'); return; }
    const result = await (camera ? ImagePicker.launchCameraAsync(PICKER) : ImagePicker.launchImageLibraryAsync(PICKER));
    if (!result.canceled && result.assets?.length) { setFile(fileFromPicker(result.assets[0])); setMeta({ kind: 'xray', tooth: '', notes: '' }); }
  };

  const send = async () => {
    const tooth = meta.tooth.trim() === '' ? undefined : Number(meta.tooth);
    if (tooth !== undefined && !isTooth(tooth)) { setError('Dente inválido (numeração FDI).'); return; }
    setBusy(true); setError(null);
    try {
      await uploadPatientImage(patient.id, file, { kind: meta.kind, tooth, takenOn: dayOf(), notes: meta.notes.trim() || undefined });
      setFile(null);
      setMessage('Imagem enviada para a ficha do paciente.');
      await res.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  const open = async (image) => {
    setError(null); setViewing({ image, url: null });
    try { setViewing({ image, url: (await Images.get(patient.id, image.id)).url }); } catch (err) { setViewing(null); setError(errorMessage(err)); }
  };

  const remove = async () => {
    try { await Images.remove(patient.id, viewing.image.id); setViewing(null); setMessage('Imagem removida.'); await res.reload(); } catch (err) { setError(errorMessage(err)); }
  };

  if (res.loading && !res.data) return <Loading />;
  if (res.error && !res.data) return <ErrorState error={res.error} onRetry={res.reload} />;
  const list = res.data.data;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {error && file === null ? <Alert tone="danger">{error}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      <Row>
        <Button title="Câmera" icon={Camera} style={{ flex: 1 }} onPress={() => pick(true)} />
        <Button title="Galeria" icon={ImageIcon} variant="secondary" style={{ flex: 1 }} onPress={() => pick(false)} />
      </Row>
      {list.length === 0 ? <View style={{ height: 220 }}><EmptyState icon={ImageIcon} title="Nenhuma imagem">Fotografe uma radiografia ou escolha uma imagem da galeria.</EmptyState></View> : list.map((image) => (
        <Card key={image.id} testID={`image-${image.id}`} onPress={() => open(image)}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Body style={{ fontWeight: '700' }}>{IMAGE_KIND[image.kind]}{image.tooth ? ` · dente ${image.tooth}` : ''}</Body>
              <Muted>{formatDay(image.takenOn)} · {image.format.toUpperCase()}</Muted>
              {image.notes ? <Muted numberOfLines={1}>{image.notes}</Muted> : null}
            </View>
          </Row>
        </Card>
      ))}

      <Sheet open={file !== null} onClose={() => setFile(null)} title="Enviar imagem" footer={<><Button title="Cancelar" variant="secondary" onPress={() => setFile(null)} /><Button title="Enviar" loading={busy} onPress={send} /></>}>
        {file ? <Image accessibilityLabel="Prévia da imagem" source={{ uri: file.uri }} style={{ width: '100%', height: 220, borderRadius: 10 }} resizeMode="contain" /> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Label>Tipo</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{Object.entries(IMAGE_KIND).map(([k, label]) => <Chip key={k} label={label} selected={meta.kind === k} onPress={() => setMeta({ ...meta, kind: k })} />)}</View>
        <Input label="Dente (opcional)" keyboardType="number-pad" maxLength={2} value={meta.tooth} onChangeText={(tooth) => setMeta({ ...meta, tooth: tooth.replace(/\D/g, '') })} />
        <Input label="Observações" autoCapitalize="sentences" value={meta.notes} onChangeText={(notes) => setMeta({ ...meta, notes })} />
      </Sheet>

      <Sheet open={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `${IMAGE_KIND[viewing.image.kind]}${viewing.image.tooth ? ` · dente ${viewing.image.tooth}` : ''}` : ''}
        footer={<><Button title="Remover" variant="danger" onPress={remove} /><Button title="Fechar" variant="secondary" onPress={() => setViewing(null)} /></>}>
        {viewing?.url ? <Image accessibilityLabel="Imagem do paciente" source={{ uri: viewing.url }} style={{ width: '100%', height: 360 }} resizeMode="contain" /> : <Loading />}
        {viewing?.image.notes ? <Body>{viewing.image.notes}</Body> : null}
      </Sheet>
    </ScrollView>
  );
}

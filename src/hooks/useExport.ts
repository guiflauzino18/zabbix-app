import { useState } from 'react';
import { Share, Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import {generatePDF } from 'react-native-html-to-pdf';
import { File, Paths } from 'expo-file-system';
import { format } from 'date-fns';
import { buildReportHTML, buildReportCSV } from '../services/reports.service';
import type { ReportData, ExportOptions } from '../api/zabbix.types';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportReport = async (
    data: ReportData,
    options: ExportOptions,
  ) => {
    setIsExporting(true);
    try {
      const fileName = `zabbix-report-${format(data.period.from, 'yyyy-MM-dd')}`;

      if (options.format === 'pdf') {
        await exportPDF(data, options, fileName);
      } else if (options.format === 'csv') {
        await exportFile(`${fileName}.csv`, buildReportCSV(data), 'text/csv');
      } else {
        await exportFile(
          `${fileName}.json`,
          JSON.stringify(data, null, 2),
          'application/json',
        );
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível gerar o relatório.');
      console.error('[Export]', err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async (
    data: ReportData,
    options: ExportOptions,
    fileName: string,
  ) => {
    const html = buildReportHTML(data, options);

    const result = await generatePDF({
      html,
      fileName,
      // Salva no cache — depois compartilhamos via expo-sharing
      directory: 'Cache',
      base64: false,
    });

    if (!result.filePath) throw new Error('PDF não gerado');

    // Verifica se o compartilhamento está disponível no dispositivo
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(`file://${result.filePath}`, {
        mimeType: 'application/pdf',
        dialogTitle: 'Salvar ou compartilhar relatório',
        UTI: 'com.adobe.pdf', // iOS
      });
    } else {
      // Fallback: salva na galeria/downloads via MediaLibrary
      await saveToDownloads(`file://${result.filePath}`, fileName + '.pdf');
    }
  };

  const exportFile = async (
    fileName: string,
    content: string,
    mimeType: string,
  ) => {
    // Salva no cache temporário do app
    const file = new File(Paths.cache, fileName);
    await file.write(content);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      // Abre diálogo nativo — usuário escolhe onde salvar (Downloads, Drive, etc)
      await Sharing.shareAsync(file.uri, {
        mimeType,
        dialogTitle: 'Salvar ou compartilhar relatório',
      });
    } else {
      await saveToDownloads(file.uri, fileName);
    }
  };

  // Fallback para salvar direto em Downloads quando sharing não está disponível
  const saveToDownloads = async (uri: string, fileName: string) => {
    if (Platform.OS !== 'android') return;

    // Solicita permissão de escrita na galeria/downloads
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso ao armazenamento para salvar o arquivo.',
      );
      return;
    }

    const asset = await MediaLibrary.createAssetAsync(uri);
    await MediaLibrary.createAlbumAsync('ZabbixApp', asset, false);

    Alert.alert(
      'Salvo!',
      `Arquivo salvo em Downloads/ZabbixApp/${fileName}`,
    );
  };

  return { exportReport, isExporting };
}
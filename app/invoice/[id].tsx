import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ArrowLeft, Download } from "lucide-react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

import { useInvoice } from "@/hooks/useInvoice";

const formatRupiah = (value: string | number) =>
  `Rp ${Number(value).toLocaleString("id-ID")}`;

const formatDate = (date: string | null) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function InvoiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { invoice, loading, error } = useInvoice(id);
  const [downloading, setDownloading] = useState(false);

  const generateHtml = () => {
    if (!invoice) return "";

    const order = invoice.orders;
    const payment = order?.payments?.[0];
    const items = order?.order_items ?? [];

    const rows = items
      .map(
        (item: any) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
            ${item.services?.name ?? "-"}
          </td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">
            ${item.qty ?? 1}
          </td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">
            ${formatRupiah(item.subtotal)}
          </td>
        </tr>
      `,
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 32px;
              color: #111827;
            }

            .header {
              text-align: center;
              margin-bottom: 28px;
            }

            .brand {
              font-size: 26px;
              font-weight: 700;
            }

            .subbrand {
              font-size: 13px;
              color: #6b7280;
              margin-top: 4px;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 24px;
            }

            .label {
              font-size: 12px;
              color: #6b7280;
            }

            .value {
              font-size: 14px;
              font-weight: 600;
              margin-top: 2px;
            }

            .section {
              margin-bottom: 20px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }

            th {
              text-align: left;
              padding: 10px;
              background: #f3f4f6;
              font-size: 12px;
              color: #6b7280;
            }

            .total-box {
              margin-top: 20px;
              text-align: right;
            }

            .total-label {
              font-size: 13px;
              color: #6b7280;
            }

            .total-value {
              font-size: 20px;
              font-weight: 700;
              margin-top: 4px;
            }

            .payment {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
            }

            .payment-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 13px;
            }

            .footer {
              margin-top: 36px;
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="brand">CARWASH</div>
            <div class="subbrand">Management App</div>
          </div>

          <div class="info-row">
            <div>
              <div class="label">Invoice</div>
              <div class="value">${invoice.invoice_no}</div>
            </div>

            <div style="text-align:right;">
              <div class="label">Date</div>
              <div class="value">${formatDate(invoice.issued_at)}</div>
            </div>
          </div>

          <div class="section">
            <div class="label">Customer</div>
            <div class="value">${order?.customers?.name ?? "-"}</div>

            <div style="font-size:12px;color:#6b7280;margin-top:2px;">
              ${order?.customers?.phone ?? ""}
            </div>
          </div>

          <div class="section">
            <div class="label">Vehicle</div>
            <div class="value">
              ${order?.vehicles?.plate_number ?? "-"}
            </div>

            <div style="font-size:12px;color:#6b7280;margin-top:2px;">
              ${
                order?.vehicles
                  ? `${order.vehicles.brand} ${order.vehicles.model}`
                  : ""
              }
            </div>
          </div>

          <div class="section">
            <div class="label">Staff</div>
            <div class="value">
              ${order?.staffs?.name ?? "Not Assigned"}
            </div>
          </div>

          <div class="section">
            <div class="label">Services</div>

            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th style="text-align:center;">Qty</th>
                  <th style="text-align:right;">Subtotal</th>
                </tr>
              </thead>

              <tbody>
                ${
                  rows ||
                  `<tr>
                    <td colspan="3" style="padding:10px;">
                      Tidak ada item
                    </td>
                  </tr>`
                }
              </tbody>
            </table>
          </div>

          <div class="total-box">
            <div class="total-label">Total</div>
            <div class="total-value">
              ${formatRupiah(invoice.total_amount)}
            </div>
          </div>

          ${
            payment
              ? `
                <div class="payment">
                  <div class="payment-row">
                    <span style="color:#6b7280;">Method</span>
                    <span style="font-weight:600;">
                      ${payment.payment_method}
                    </span>
                  </div>

                  <div class="payment-row">
                    <span style="color:#6b7280;">Amount Received</span>
                    <span style="font-weight:600;">
                      ${formatRupiah(payment.amount_received)}
                    </span>
                  </div>

                  <div class="payment-row">
                    <span style="color:#6b7280;">Change</span>
                    <span style="font-weight:600;">
                      ${formatRupiah(payment.change_amount ?? 0)}
                    </span>
                  </div>
                </div>
              `
              : ""
          }

          <div class="footer">
            Thank you for your visit!<br />
            Please keep this invoice as your payment receipt.
          </div>
        </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    if (!invoice || downloading) return;

    try {
      setDownloading(true);

      const html = generateHtml();

      const { base64 } = await Print.printToFileAsync({
        html,
        base64: true,
      });

      if (!base64) {
        throw new Error("PDF base64 tidak tersedia");
      }

      if (!FileSystem.cacheDirectory) {
        throw new Error("Cache directory tidak tersedia");
      }

      const safeInvoiceNumber = String(invoice.invoice_no).replace(
        /[^a-zA-Z0-9-_]/g,
        "_",
      );

      const fileUri = `${FileSystem.cacheDirectory}invoice-${safeInvoiceNumber}.pdf`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        throw new Error("File PDF gagal dibuat");
      }

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        throw new Error("Fitur sharing tidak tersedia di perangkat ini");
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        dialogTitle: `Invoice ${invoice.invoice_no}`,
        UTI: "com.adobe.pdf",
      });
    } catch (err) {
      console.log("DOWNLOAD INVOICE ERROR:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-4 text-sm text-gray-500">Loading invoice...</Text>
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="h-[110px] flex-row items-center justify-between border-b border-gray-200 bg-white px-5 pt-[55px]">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="#111827" />
          </Pressable>

          <Text className="text-lg font-bold text-gray-900">Invoice</Text>

          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-xl font-bold text-gray-900">
            {error || "Invoice tidak ditemukan"}
          </Text>

          <Pressable
            className="mt-6 h-12 items-center justify-center rounded-xl bg-gray-900 px-6"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-bold text-white">Kembali</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const order = invoice.orders;
  const payment = order?.payments?.[0];

  return (
    <View className="flex-1 bg-gray-50">
      <View className="h-[110px] flex-row items-center justify-between border-b border-gray-200 bg-white px-5 pt-[55px]">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color="#111827" />
        </Pressable>

        <Text className="text-lg font-bold text-gray-900">Invoice</Text>

        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <View className="mb-6 items-center rounded-2xl border border-gray-200 bg-white py-6">
          <Text className="text-2xl font-bold text-gray-900">CARWASH</Text>

          <Text className="mt-1 text-sm text-gray-500">Management App</Text>
        </View>

        <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-gray-500">Invoice</Text>

              <Text className="mt-1 text-base font-bold text-gray-900">
                {invoice.invoice_no}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-xs text-gray-500">Date</Text>

              <Text className="mt-1 text-sm font-medium text-gray-900">
                {formatDate(invoice.issued_at)}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
          <View className="mb-4">
            <Text className="text-xs text-gray-500">Customer</Text>

            <Text className="mt-1 text-sm font-semibold text-gray-900">
              {order.customers?.name ?? "-"}
            </Text>

            <Text className="mt-0.5 text-xs text-gray-500">
              {order.customers?.phone ?? "-"}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-xs text-gray-500">Vehicle</Text>

            <Text className="mt-1 text-sm font-semibold text-gray-900">
              {order.vehicles?.plate_number ?? "-"}
            </Text>

            <Text className="mt-0.5 text-xs text-gray-500">
              {order.vehicles
                ? `${order.vehicles.brand} ${order.vehicles.model}`
                : "-"}
            </Text>
          </View>

          <View>
            <Text className="text-xs text-gray-500">Staff</Text>

            <Text className="mt-1 text-sm font-semibold text-gray-900">
              {order.staffs?.name ?? "Not Assigned"}
            </Text>

            {order.staffs?.phone ? (
              <Text className="mt-0.5 text-xs text-gray-500">
                {order.staffs.phone}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="mb-3 text-sm font-bold text-gray-900">Services</Text>

          <View className="mb-2 flex-row border-b border-gray-100 pb-2">
            <Text className="flex-1 text-xs font-medium text-gray-500">
              Service
            </Text>

            <Text className="w-12 text-center text-xs font-medium text-gray-500">
              Qty
            </Text>

            <Text className="w-24 text-right text-xs font-medium text-gray-500">
              Subtotal
            </Text>
          </View>

          {order.order_items?.map((item) => (
            <View key={item.id} className="mb-3 flex-row items-center">
              <Text className="flex-1 text-sm font-medium text-gray-900">
                {item.services?.name ?? "-"}
              </Text>

              <Text className="w-12 text-center text-sm text-gray-700">
                {item.qty ?? 1}
              </Text>

              <Text className="w-24 text-right text-sm font-medium text-gray-900">
                {formatRupiah(item.subtotal)}
              </Text>
            </View>
          ))}

          <View className="mt-2 flex-row items-center justify-between border-t border-gray-100 pt-3">
            <Text className="text-base font-semibold text-gray-900">Total</Text>

            <Text className="text-lg font-bold text-gray-900">
              {formatRupiah(invoice.total_amount)}
            </Text>
          </View>
        </View>

        {payment && (
          <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
            <Text className="mb-3 text-sm font-bold text-gray-900">
              Payment
            </Text>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-sm text-gray-500">Method</Text>

              <Text className="text-sm font-medium text-gray-900">
                {payment.payment_method}
              </Text>
            </View>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-sm text-gray-500">Amount Received</Text>

              <Text className="text-sm font-medium text-gray-900">
                {formatRupiah(payment.amount_received)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">Change</Text>

              <Text className="text-sm font-medium text-gray-900">
                {formatRupiah(payment.change_amount ?? "0")}
              </Text>
            </View>
          </View>
        )}

        <View className="mb-6 items-center py-4">
          <Text className="text-sm font-medium text-gray-900">
            Thank you for your visit!
          </Text>

          <Text className="mt-1 text-center text-xs text-gray-500">
            Please keep this invoice as your payment receipt.
          </Text>
        </View>

        <Pressable
          className="h-[52px] flex-row items-center justify-center rounded-[14px] bg-gray-900"
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Download size={18} color="#fff" />

              <Text className="ml-2 text-[15px] font-bold text-white">
                Download PDF
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

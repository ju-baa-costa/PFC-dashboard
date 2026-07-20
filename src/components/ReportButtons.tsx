interface Props {
  onCompleto: () => void;
  onResumido: () => void;
}

export default function ReportButtons({ onCompleto, onResumido }: Props) {
  return (
    <div className="report-buttons">
      <button className="pdf-btn pdf-btn-completo" onClick={onCompleto}>
        📄 Relatório Completo (PDF)
      </button>

      <button className="pdf-btn pdf-btn-resumido" onClick={onResumido}>
        📄 Relatório Resumido (PDF)
      </button>
    </div>
  );
}

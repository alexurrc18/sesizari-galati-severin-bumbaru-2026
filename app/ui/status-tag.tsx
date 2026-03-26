export default function StatusTag({ status }: { status: string }) {
    let style = "";
    let text = "";

    switch (status) {
        case "rezolvat":
            style = "bg-green-100 text-green-700";
            text = "Rezolvat";
            break;
        case "inlucru":
            style = "bg-orange-100 text-orange-700";
            text = "În lucru";
            break;
        case "propus":
            style = "bg-blue-100 text-blue-700";
            text = "Propus";
            break;
        default:
            style = "bg-red-100 text-red-700";
            text = "Respins";
            break;
    }

    return (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${style}`}>
            {text}
        </span>
    );
}
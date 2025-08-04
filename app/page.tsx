import { Box, Link, Typography, Grid2 } from "@mui/material";
import Ema from "@/app/ui/Ema";
import NextLink from "next/link";

const linkContent = [
  { name: "算額を作る", href: "/sangakus/create" },
  { name: "算額を確認", href: "/user/sangakus" },
  { name: "神社を探す", href: "/shrines" },
  { name: "算額を解く", href: "#" },
];

export default function Home() {
  return (
    <Box>
      <Box sx={{ display: "flex", mb: "2rem" }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ mx: "auto", fontFamily: "Noto Serif JP Variable" }}
        >
          アルゴ算額
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mb: "3rem" }}>
        <Ema width={21}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: "1rem" }}>
            <Typography variant="h4" component="h3">
              算額とは
            </Typography>
          </Box>
          <Typography>
            算額とは、神社や寺院に奉納された和算の絵馬のことで、日本独自に広まった文化だと言われています。
            <br />
            難問が多いですが、問題が解けた喜びを神仏に感謝したり、学業成就を祈願する風習として親しまれてきました。
          </Typography>
        </Ema>
      </Box>
      <Grid2
        container
        rowSpacing={1}
        columnSpacing={2}
        sx={{
          display: "flex",
          justifyContent: "space-around",
        }}
      >
        {linkContent.map(({ name, href }) => (
          <Grid2
            size={6}
            key={name}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Link component={NextLink} href={href} sx={{ mb: 2 }}>
              <Ema width={10}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    height: "100%",
                    alignItems: "center",
                    color: "black",
                  }}
                >
                  <Typography variant="h6" component="h4">
                    {name}
                  </Typography>
                </Box>
              </Ema>
            </Link>
          </Grid2>
        ))}
      </Grid2>
    </Box>
  );
}
